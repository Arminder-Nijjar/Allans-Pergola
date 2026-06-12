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
import resend

# Email configuration
resend_api_key = os.environ.get("RESEND_API_KEY", "")
from_email = os.environ.get("FROM_EMAIL", "noreply@allanslandscaping.ca")
to_emails_env = os.environ.get("TO_EMAILS", "narminder1@gmail.com")
to_emails = to_emails_env.split(",") if to_emails_env else ["narminder1@gmail.com"]

if resend_api_key:
    resend.api_key = resend_api_key

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

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

    features = []
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
        lines.append(("Custom Pergola — pricing available upon consultation", None))

    parts = []
    for label, value in lines:
        if value is None:
            parts.append(f"<tr><td style='padding:4px 0;border-bottom:1px solid #eee;'><strong>{label}</strong></td><td style='padding:4px 0;border-bottom:1px solid #eee;text-align:right;'></td></tr>")
        else:
            parts.append(f"<tr><td style='padding:4px 0;border-bottom:1px solid #eee;'>{label}</td><td style='padding:4px 0;border-bottom:1px solid #eee;text-align:right;font-weight:600;'>${value:,.2f}</td></tr>")

    return "<table style='width:100%;border-collapse:collapse;'>" + "".join(parts) + "</table>"


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
    if not resend_api_key or not to_emails:
        logger.info("Email not sent: RESEND_API_KEY or TO_EMAILS not configured")
        return

    html_content = build_email_html(quote)

    try:
        params = {
            "from": f"Pergola Configurator <{from_email}>",
            "to": to_emails,
            "subject": f"New Pergola Design - {quote.name}",
            "html": html_content,
            "reply_to": quote.email,
        }
        resend.Emails.send(params)
        logger.info("Email sent successfully for quote %s", quote.id)
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
