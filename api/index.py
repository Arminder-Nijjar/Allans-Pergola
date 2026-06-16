"""Pergola Builder — FastAPI backend (Vercel Serverless).
Stores incoming quote leads and sends automated HTML email summaries.
"""

import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from starlette.middleware.cors import CORSMiddleware
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

# Email configuration — uses SendGrid for delivery
sendgrid_api_key = os.environ.get("SENDGRID_API_KEY", "")
from_email = os.environ.get("FROM_EMAIL", "narminder1@gmail.com")
to_emails_env = os.environ.get("TO_EMAILS", "jane@allans.blue")
to_emails = [e.strip() for e in to_emails_env.split(",") if e.strip()] if to_emails_env else ["jane@allans.blue"]

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Startup diagnostic
logger.info("Email config: from=%s to=%s key_present=%s", from_email, to_emails, bool(sendgrid_api_key))

# Helper: calculate louver sets for a section (mirrors frontend logic)
LOUVER_MAX_SPAN = 15  # ft

def _louver_set_count(section: Dict[str, Any]) -> int:
    """Number of louver sets needed for a section."""
    length = section.get("length", 0)
    width = section.get("width", 0)
    larger = max(length, width)
    # If larger dimension ≤ 16 ft → 1 set
    if larger <= 16:
        return 1
    # Otherwise split larger dimension into ≤15-ft sets
    return (larger + LOUVER_MAX_SPAN - 1) // LOUVER_MAX_SPAN  # ceiling division

app = FastAPI(title="Pergola Builder API", version="1.0.0")

# Add CORS middleware BEFORE routers
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")


# ---------- Models ----------

class QuoteCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=4, max_length=40)
    address: Optional[str] = Field(default=None, max_length=240)
    notes: Optional[str] = Field(default=None, max_length=1200)
    config: Dict[str, Any]
    share_url: Optional[str] = Field(default=None, max_length=8000)


class Quote(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: str
    address: Optional[str] = None
    notes: Optional[str] = None
    config: Dict[str, Any]
    share_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ---------- Routes ----------

@api_router.get("/")
async def root():
    return {"service": "Pergola Builder", "status": "ok"}


@api_router.post("/quotes", response_model=Quote)
async def create_quote(payload: QuoteCreate):
    quote = Quote(**payload.model_dump())
    # Send email notification (best effort)
    try:
        await send_quote_email(quote)
    except Exception as email_exc:
        logger.warning("Failed to send email notification: %s", email_exc)
    return quote


@api_router.get("/quotes", response_model=List[Quote])
async def list_quotes():
    return []


# ---------- Email Service ----------

def build_config_summary(config: Dict[str, Any]) -> str:
    """Build a human-readable summary of the pergola configuration."""
    sections = config.get("sections", [])
    if not sections:
        return "No configuration details available."

    layout = config.get("layout", "horizontal")
    style = config.get("style", "freestanding")

    section_details = []
    for i, section in enumerate(sections, 1):
        length = section.get("length", 0)
        width = section.get("width", 0)
        height = section.get("height", 0)
        section_details.append(f"Section {i}: {length}′ × {width}′ × {height}′")

    post_color = config.get("postColor", "umbra-grey").replace("-", " ").title()
    louver_color = config.get("louverColor", "pure-white").replace("-", " ").title()
    louver_op = config.get("louverOperation", "manual")
    louver_control = config.get("louverControlType", "remote")
    
    if louver_op == "motorized":
        control_label = "App Control" if louver_control == "app" else "Remote Control"
    else:
        control_label = louver_op.replace("-", " ").title()
    
    features = []
    if layout == "10x12-kit":
        features.append(f"Louver Operation: {control_label} (preference — availability confirmed by size)")

    light_color = config.get("lightColor", "none")
    if light_color and light_color != "none":
        features.append(f"LED Lighting ({light_color.replace('-', ' ').title()})")

    screens = config.get("screens", [])
    if screens:
        screen_count = len(screens)
        screen_color = config.get("screenColor", "beige").replace("-", " ").title()
        features.append(f"Zip Screens: {screen_count} ({screen_color})")

    walls = config.get("walls", [])
    if walls:
        wall_count = len(walls)
        features.append(f"Privacy Walls: {wall_count}")

    summary_parts = [
        f"<strong>Layout:</strong> {layout.replace('-', ' ').title()}",
        f"<strong>Style:</strong> {style.replace('-', ' ').title()}",
        f"<strong>Dimensions:</strong> {', '.join(section_details)}",
        f"<strong>Frame Color:</strong> {post_color}",
        f"<strong>Louver Color:</strong> {louver_color}",
    ]

    if features:
        summary_parts.append(f"<strong>Features:</strong> {', '.join(features)}")

    # Site photos
    site_photos = config.get("sitePhotos", [])
    if site_photos:
        summary_parts.append(f"<strong>Site Photos:</strong> {len(site_photos)} photo(s) uploaded (see attachments in email client)")

    return "<br>".join(summary_parts)


def build_pricing_summary(config: Dict[str, Any]) -> str:
    """Calculate estimated pricing for the configuration (internal use only)."""
    layout = config.get("layout", "")
    is_kit = layout == "10x12-kit"

    lines = []
    total = 0

    if is_kit:
        base = 10000
        lines.append(("Pergola Kit (10'×12'×9')", base))
        total += base

        louver_op = config.get("louverOperation", "manual")
        if louver_op == "motorized":
            lines.append(("  Upgrade: Motorized Louvers (Remote)", 2200))
            total += 2200

        kit_light_sides = config.get("kitLightSides", "front-back")
        light_color = config.get("lightColor", "warm")
        if kit_light_sides != "none" and light_color != "none":
            light_price = 2250 if light_color == "rgb" else 1850
            lines.append(("  Lights (Front + Back - 12 ft sides)", light_price))
            total += light_price

        screens = config.get("screens", [])
        if screens:
            screen_color = config.get("screenColor", "white")
            color_label = screen_color.replace("-", " ").title()
            for s in screens:
                side = s.get("side", "")
                side_len = 12 if side in ("front", "back") else 10
                price = 3050 if side_len == 12 else 2850
                side_label = side.title()
                lines.append((f"  Manual Screen — {side_label} ({color_label})", price))
                total += price

        walls = config.get("walls", [])
        if walls:
            for w in walls:
                side = w.get("side", "")
                side_len = 12 if side in ("front", "back") else 10
                price = 5940 if side_len == 12 else 4950
                lines.append((f"  Wall — {side.title()}", price))
                total += price

        lines.append(("Subtotal", total))
        gst = round(total * 0.05, 2)
        pst = round(total * 0.06, 2)
        lines.append(("  GST (5%)", gst))
        lines.append(("  PST (6%)", pst))
        lines.append(("Estimated Total", round(total + gst + pst, 2)))
    else:
        # Custom pergola pricing
        sections = config.get("sections", [])
        total_sqft = sum(s.get("length", 0) * s.get("width", 0) for s in sections)
        num_sections = len(sections)

        # Count posts (from config or estimate)
        post_plan = config.get("postPlan", {})
        total_posts = post_plan.get("total", 4 * num_sections)
        corner_posts = post_plan.get("cornerPosts", 4 * num_sections)
        extra_posts = max(0, total_posts - (4 * num_sections))

        # Determine pricing tier
        is_multi_section = num_sections > 1 or extra_posts > 0
        
        if total_sqft < 64:
            # Below minimum — use extra-small rate as base
            sqft_rate = 160
            tier_name = "Extra-Small Pergola (< 64 sqft)"
        elif 64 <= total_sqft <= 99:
            sqft_rate = 160
            tier_name = "Extra-Small Pergola (64–99 sqft)"
        elif 100 <= total_sqft <= 119:
            sqft_rate = 150
            tier_name = "Small Pergola (100–119 sqft)"
        elif is_multi_section:
            sqft_rate = 140
            tier_name = "Multi-Section Pergola (extra posts or split louvers)"
        else:
            sqft_rate = 130
            tier_name = "Standard Pergola (4 posts only)"

        base_price = round(total_sqft * sqft_rate)
        lines.append((f"{tier_name}: {total_sqft} sqft × ${sqft_rate}", base_price))
        total += base_price

        # Extra posts
        if extra_posts > 0:
            # Check for extra-long posts (10-13 ft)
            tall_post_count = sum(1 for s in sections if s.get("height", 9) >= 10)
            regular_extra = max(0, extra_posts - tall_post_count)
            
            if regular_extra > 0:
                regular_post_cost = regular_extra * 1200
                lines.append((f"  Extra Posts: {regular_extra} × $1,200", regular_post_cost))
                total += regular_post_cost
            
            if tall_post_count > 0:
                tall_post_cost = tall_post_count * 600
                lines.append((f"  Extra-Long Posts (10-13 ft): {tall_post_count} × $600", tall_post_cost))
                total += tall_post_cost

        # Support beam (if attached or needs support on short side)
        style = config.get("style", "freestanding")
        if style == "attached":
            lines.append(("  Support Beam (attached to house)", 1200))
            total += 1200

        # Louver operation (per louver set)
        louver_op = config.get("louverOperation", "manual")
        louver_control = config.get("louverControlType", "remote")
        if louver_op == "motorized":
            is_app = louver_control == "app"
            # Calculate total louver sets across all sections
            total_sets = sum(_louver_set_count(s) for s in sections)
            base_cost = 2200 * total_sets
            op_cost = base_cost + (700 * total_sets) if is_app else base_cost
            control_label = "App" if is_app else "Remote"
            per_set_price = "$2,900" if is_app else "$2,200"
            lines.append((f"  {control_label} Louvers: {total_sets} set{'s' if total_sets > 1 else ''} × {per_set_price}", op_cost))
            total += op_cost

        # Lighting (per section for multi-section)
        light_color = config.get("lightColor", "none")
        if light_color == "warm" or light_color == "white":
            light_price = 2850 * num_sections
            if num_sections > 1:
                lines.append((f"  White LED Lights: {num_sections} sections × $2,850", light_price))
            else:
                lines.append(("  White LED Lights (all 4 sides)", light_price))
            total += light_price
        elif light_color == "rgb":
            light_price = 3250 * num_sections
            if num_sections > 1:
                lines.append((f"  RGB Lights: {num_sections} sections × $3,250", light_price))
            else:
                lines.append(("  RGB Color-Changing Lights (all 4 sides)", light_price))
            total += light_price

        # Walls ($55 per sqft)
        walls = config.get("walls", [])
        if walls:
            for w in walls:
                side = w.get("side", "")
                section_idx = next((i for i, s in enumerate(sections) if s.get("id") == w.get("sectionId")), 0)
                section = sections[section_idx] if section_idx < len(sections) else sections[0] if sections else {"length": 12, "width": 10, "height": 9}
                
                # Determine wall dimensions
                side_len = section.get("length", 12) if side in ("front", "back") else section.get("width", 10)
                height = section.get("height", 9)
                wall_sqft = side_len * height
                wall_price = round(wall_sqft * 55)
                
                lines.append((f"  Wall — {side.title()}: {side_len}' × {height}' = {wall_sqft} sqft × $55", wall_price))
                total += wall_price

        # Screens (from pricing table)
        screens = config.get("screens", [])
        if screens:
            screen_op = config.get("screenOperation", "remote")  # default remote
            for s in screens:
                side = s.get("side", "")
                section_idx = next((i for i, sec in enumerate(sections) if sec.get("id") == s.get("sectionId")), 0)
                section = sections[section_idx] if section_idx < len(sections) else sections[0] if sections else {"length": 12, "width": 10, "height": 9}
                
                # Determine screen dimensions
                width_ft = section.get("length", 12) if side in ("front", "back") else section.get("width", 10)
                height_ft = section.get("height", 9)
                
                # Get screen price from table lookup (approximate based on dimensions)
                screen_price = _get_screen_price(width_ft, height_ft)
                
                # Apply manual discount if requested
                if screen_op == "manual":
                    screen_price -= 1100
                    price_label = f"Manual Screen — {side.title()} ({width_ft}' × {height_ft}') -$1,100"
                else:
                    price_label = f"Remote Screen — {side.title()} ({width_ft}' × {height_ft}')"
                
                lines.append((f"  {price_label}", screen_price))
                total += screen_price

        lines.append(("Subtotal", total))
        gst = round(total * 0.05, 2)
        pst = round(total * 0.06, 2)
        lines.append(("  GST (5%)", gst))
        lines.append(("  PST (6%)", pst))
        lines.append(("Estimated Total", round(total + gst + pst, 2)))

    # Build HTML table from lines
    parts = []
    for label, value in lines:
        if value is None:
            parts.append(f"<tr><td style='padding:4px 0;border-bottom:1px solid #eee;'><strong>{label}</strong></td><td style='padding:4px 0;border-bottom:1px solid #eee;text-align:right;'></td></tr>")
        else:
            parts.append(f"<tr><td style='padding:4px 0;border-bottom:1px solid #eee;'>{label}</td><td style='padding:4px 0;border-bottom:1px solid #eee;text-align:right;font-weight:600;'>${value:,.2f}</td></tr>")

    return "<table style='width:100%;border-collapse:collapse;'>" + "".join(parts) + "</table>"


def _get_screen_price(width_ft: float, height_ft: float) -> int:
    """Get screen price from pricing table based on width and height."""
    # Screen pricing table (width × height) - extracted from image
    # Prices are for remote operation (default)
    price_table = {
        # Width: [4', 4.5', 5', 5.5', 6', 6.5', 7', 7.5', 8', 8.5', 9', 9.5', 10', 10.5', 11', 11.5', 12', 12.5', 13', 13.5', 14', 14.5', 15', 15.5', 16', 16.5', 17', 17.5', 18', 18.5']
        4: [2880, 2920, 3065, 3170, 3200, 3270, 3375, 3425, 3525, 3635, 3665, 3815, 3920, 3980, 4030, 4050, 4130, 4220, 4275, 4325, 4430, 4485, 4570, 4635, 4685, 4740, 4840, 4900, 4950, 5040],
        5: [2940, 3000, 3140, 3190, 3240, 3345, 3450, 3500, 3595, 3695, 3760, 3900, 3985, 4040, 4095, 4145, 4190, 4320, 4345, 4450, 4560, 4600, 4700, 4750, 4850, 4880, 4940, 4910, 5020, 5115],
        6: [3060, 3115, 3200, 3255, 3310, 3460, 3555, 3615, 3665, 3760, 3830, 4270, 4370, 4410, 4560, 4610, 4650, 4790, 4830, 4915, 5070, 5145, 5180, 5335, 5385, 5445, 5540, 5645, 5700, 5800],
        7: [3235, 3280, 3335, 3425, 3475, 3680, 3825, 3885, 3985, 4035, 4180, 4335, 4425, 4450, 4480, 4635, 4685, 4730, 4890, 4935, 4985, 5145, 5220, 5260, 5330, 5470, 5530, 5560, 5620, 5770],
        8: [3330, 3345, 3540, 3585, 3640, 3750, 3900, 3955, 4050, 4175, 4250, 4400, 4480, 4560, 4610, 4750, 4810, 4860, 5020, 5060, 5125, 5275, 5335, 5410, 5500, 5530, 5590, 5640, 5750, 5930],
        9: [3355, 4330, 3600, 3660, 3700, 3750, 3800, 4020, 4100, 4260, 4320, 4480, 4560, 4610, 4750, 4810, 4860, 5020, 5060, 5125, 5275, 5335, 5410, 5500, 5530, 5590, 5640, 5750, 5925, 6000],
        10: [3525, 3575, 3680, 3770, 3770, 3885, 4040, 4090, 4185, 4330, 4390, 4535, 4620, 4675, 4825, 4890, 4930, 5075, 5135, 5250, 5400, 5450, 5500, 5590, 5635, 5680, 5750, 5840, 5930, 6070],
        11: [3585, 3640, 3770, 3780, 3850, 3930, 4085, 4150, 4250, 4390, 4450, 4600, 4685, 4750, 4890, 4930, 5075, 5135, 5200, 5250, 5400, 5500, 5530, 5590, 5640, 5750, 5840, 5870, 5960, 6150],
        12: [3600, 3660, 3700, 3810, 3850, 4040, 4100, 4440, 4490, 4675, 4730, 4850, 4920, 4980, 5140, 5260, 5260, 5400, 5480, 5500, 5580, 5650, 5770, 5870, 6050, 5870, 5960, 6050, 5960, 6150],
        13: [3880, 3875, 3975, 4040, 4175, 4385, 4485, 4540, 4735, 4835, 4890, 4920, 4980, 5070, 5140, 5240, 5345, 5500, 5550, 5580, 5650, 5770, 5870, 5850, 6000, 6050, 6200],
        14: [3900, 4000, 4050, 4150, 4250, 4400, 4550, 4600, 4850, 4950, 5050, 5200, 5300, 5400, 5565, 5650, 5750, 5850, 5870, 5960, 6050, 6200],
    }
    
    # Round to nearest table value
    width_key = min(max(int(width_ft), 4), 14)
    height_key = min(max(int(height_ft), 4), 14)
    
    # Get width index (every 0.5 ft step)
    width_decimal = width_ft - int(width_ft)
    if width_decimal >= 0.75:
        width_idx = (int(width_ft) - 4) * 2 + 2
    elif width_decimal >= 0.25:
        width_idx = (int(width_ft) - 4) * 2 + 1
    else:
        width_idx = (int(width_ft) - 4) * 2
    
    width_idx = min(width_idx, 29)  # max index for 18.5'
    
    try:
        return price_table.get(height_key, price_table[10])[width_idx]
    except (IndexError, KeyError):
        # Fallback: interpolate
        base_price = 3000 + (width_ft * height_ft * 15)
        return round(base_price / 10) * 10


def build_email_html(quote: Quote) -> str:
    """Build professional HTML email with configuration summary."""
    config = quote.config or {}
    config_summary = build_config_summary(config)
    pricing_summary = build_pricing_summary(config)

    created_at = quote.created_at.strftime("%B %d, %Y at %I:%M %p") if isinstance(quote.created_at, datetime) else str(quote.created_at)

    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Pergola Design Submission</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; }}
        .header {{ background: linear-gradient(135deg, #1a3a2f 0%, #1a7a4b 100%); color: white; padding: 30px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 24px; font-weight: 600; }}
        .header p {{ margin: 10px 0 0 0; opacity: 0.9; font-size: 14px; }}
        .content {{ padding: 30px; }}
        .section {{ margin-bottom: 25px; }}
        .section-title {{ font-size: 14px; font-weight: 600; color: #1a7a4b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; border-bottom: 2px solid #1a7a4b; padding-bottom: 5px; }}
        .info-row {{ display: flex; margin-bottom: 8px; }}
        .info-label {{ font-weight: 600; color: #666; width: 120px; flex-shrink: 0; }}
        .info-value {{ color: #333; }}
        .config-box {{ background-color: #f8f9fa; border-left: 4px solid #1a7a4b; padding: 15px; margin: 15px 0; border-radius: 0 4px 4px 0; }}
        .footer {{ background-color: #f8f9fa; padding: 20px 30px; text-align: center; font-size: 12px; color: #666; }}
        .badge {{ display: inline-block; padding: 4px 10px; background-color: #1a7a4b; color: white; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Pergola Design Submission</h1>
            <p>Premium Aluminum Pergola Configurator</p>
        </div>
        <div class="content">
            <div class="section">
                <div class="section-title">Customer Information</div>
                <div class="info-row"><span class="info-label">Name:</span><span class="info-value">{quote.name}</span></div>
                <div class="info-row"><span class="info-label">Email:</span><span class="info-value">{quote.email}</span></div>
                <div class="info-row"><span class="info-label">Phone:</span><span class="info-value">{quote.phone}</span></div>
                {f'<div class="info-row"><span class="info-label">Address:</span><span class="info-value">{quote.address}</span></div>' if quote.address else ''}
            </div>
            {f"""<div class="section">
                <div class="section-title">View Design</div>
                <p style="margin:0 0 10px 0;color:#555;">Click below to open the customer's exact 3D design:</p>
                <a href="{quote.share_url}" style="display:inline-block;padding:10px 20px;background:linear-gradient(135deg, #1a3a2f 0%, #1a7a4b 100%);color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Open Design in Builder</a>
            </div>""" if quote.share_url else ''}
            <div class="section">
                <div class="section-title">Pergola Configuration</div>
                <div class="config-box">{config_summary}</div>
            </div>
            <div class="section">
                <div class="section-title">Internal Pricing Estimate (not shown to customer)</div>
                <div class="config-box" style="background-color:#fff8e1;border-left-color:#f0a000;">
                    {pricing_summary}
                    <p style="margin:10px 0 0 0;font-size:11px;color:#888;">Supply only. Not including installation or delivery. Pick-up price. Taxes included in estimate.</p>
                </div>
            </div>
            {f'<div class="section"><div class="section-title">Notes</div><p style="margin:0;color:#555;">{quote.notes}</p></div>' if quote.notes else ''}
            {f"""<div class="section">
                <div class="section-title">Site Photos</div>
                <p style="margin:0 0 10px 0;color:#555;">The customer uploaded {len(quote.config.get('sitePhotos', []))} photo(s) of the installation site. Check email attachments for images.</p>
            </div>""" if quote.config.get("sitePhotos") else ''}
            <div class="section">
                <div class="section-title">Submission Details</div>
                <div class="info-row"><span class="info-label">Quote ID:</span><span class="info-value">{quote.id}</span></div>
                <div class="info-row"><span class="info-label">Submitted:</span><span class="info-value">{created_at}</span></div>
            </div>
            <div style="background-color: #e8f5e9; border-radius: 8px; padding: 20px; margin-top: 25px; text-align: center;">
                <p style="margin: 0 0 10px 0; color: #1a7a4b; font-weight: 600;">Next Steps</p>
                <p style="margin: 0; color: #555; font-size: 14px;">Our team will review this custom design and contact the customer within 1-2 business days to discuss their project.</p>
            </div>
        </div>
        <div class="footer">
            <p style="margin: 0 0 10px 0;"><span class="badge">Authorized Dealer</span></p>
            <p style="margin: 0;"><strong>Allan's Landscaping & Disposal</strong><br>Premium Aluminum Pergolas for Saskatchewan Weather</p>
            <p style="margin: 10px 0 0 0; font-size: 11px;">This is an automated message from the Pergola Configurator.<br>Design configurations are estimates pending final site inspection.</p>
        </div>
    </div>
</body>
</html>"""


async def send_quote_email(quote: Quote) -> None:
    """Send email notification for a new quote submission."""
    if not sendgrid_api_key:
        logger.warning("Email not sent: SENDGRID_API_KEY missing")
        return
    if not to_emails:
        logger.warning("Email not sent: TO_EMAILS empty")
        return

    html_content = build_email_html(quote)

    try:
        sg = SendGridAPIClient(sendgrid_api_key)
        message = Mail(
            from_email=from_email,
            to_emails=to_emails,
            subject=f"New Pergola Design - {quote.name}",
            html_content=html_content,
        )
        message.reply_to = quote.email

        # Attach site photos if uploaded
        site_photos = quote.config.get("sitePhotos", []) if quote.config else []
        for i, photo in enumerate(site_photos):
            try:
                import base64
                photo_data = photo.get("data", "")
                if photo_data.startswith("data:image"):
                    # Extract base64 content after the comma
                    content_type = photo_data.split(";")[0].split(":")[1]
                    base64_data = photo_data.split(",")[1]
                    filename = photo.get("name", f"site_photo_{i+1}.jpg")
                    attachment = {
                        "content": base64_data,
                        "type": content_type,
                        "filename": filename,
                        "disposition": "attachment",
                    }
                    message.add_attachment(attachment)
            except Exception as photo_exc:
                logger.warning("Failed to attach photo %s: %s", i, photo_exc)

        logger.info("Sending email to=%s from=%s quote=%s photos=%s", to_emails, from_email, quote.id, len(site_photos))
        response = sg.send(message)
        logger.info("Email sent: status=%s quote=%s", response.status_code, quote.id)
    except Exception as exc:
        logger.exception("Failed to send email for quote %s: %s", quote.id, exc)
        raise


app.include_router(api_router)


# Explicit OPTIONS handler for CORS preflight
@app.options("/{full_path:path}")
async def preflight_handler(full_path: str):
    from fastapi.responses import Response
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
        },
    )
