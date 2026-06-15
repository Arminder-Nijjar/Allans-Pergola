import React, { useState, useMemo } from 'react';
import { Pencil, Calculator } from 'lucide-react';
import CompareConfigsView from './CompareConfigsView';
import { StepHeader } from './_shared';
import { POST_COLORS, LOUVER_COLORS, SCREEN_COLORS, WALL_COLORS, LIGHT_COLORS } from '../../data/catalog';
import { totalPostPlan, louverSetCount, louverOperation, screenOperation } from '../../utils/pergolaRules';
import { getSteps } from '../../utils/steps';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Textarea } from '../ui/textarea';

// Screen pricing table from the image (width × height)
const SCREEN_PRICES = {
  // Width: [4', 4.5', 5', 5.5', 6', 6.5', 7', 7.5', 8', 8.5', 9', 9.5', 10', 10.5', 11', 11.5', 12', 12.5', 13', 13.5', 14', 14.5', 15', 15.5', 16', 16.5', 17', 17.5', 18', 18.5']
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
};

function getScreenPrice(widthFt, heightFt) {
  const widthKey = Math.min(Math.max(Math.round(widthFt), 4), 14);
  const heightKey = Math.min(Math.max(Math.round(heightFt), 4), 14);
  const widthIdx = Math.min(Math.max(Math.round((widthFt - 4) * 2), 0), 29);
  const prices = SCREEN_PRICES[heightKey] || SCREEN_PRICES[10];
  return prices[widthIdx] || prices[0] || 3000;
}

function calculatePricing(cfg) {
  const lines = [];
  let total = 0;
  const isKit = cfg.layout === '10x12-kit';
  const sections = cfg.sections || [];
  const numSections = sections.length;
  const totalSqft = sections.reduce((sum, s) => sum + (s.length || 0) * (s.width || 0), 0);

  if (isKit) {
    // Kit pricing
    lines.push({ label: 'Pergola Kit (10\'×12\'×9\')', price: 10000 });
    total += 10000;

    if (cfg.louverOperation === 'motorized') {
      lines.push({ label: 'Upgrade: Motorized Louvers (Remote)', price: 2200 });
      total += 2200;
    }

    if (cfg.kitLightSides !== 'none' && cfg.lightColor !== 'none') {
      const lightPrice = cfg.lightColor === 'rgb' ? 2250 : 1850;
      lines.push({ label: `Lights (${cfg.kitLightSides})`, price: lightPrice });
      total += lightPrice;
    }

    if (cfg.screens?.length > 0) {
      cfg.screens.forEach(s => {
        const side = s.side || '';
        const sideLen = side === 'front' || side === 'back' ? 12 : 10;
        const price = sideLen === 12 ? 3050 : 2850;
        lines.push({ label: `Screen — ${side.charAt(0).toUpperCase() + side.slice(1)}`, price });
        total += price;
      });
    }

    if (cfg.walls?.length > 0) {
      cfg.walls.forEach(w => {
        const side = w.side || '';
        const sideLen = side === 'front' || side === 'back' ? 12 : 10;
        const price = sideLen === 12 ? 5940 : 4950;
        lines.push({ label: `Wall — ${side.charAt(0).toUpperCase() + side.slice(1)}`, price });
        total += price;
      });
    }
  } else {
    // Custom pergola pricing
    const plan = totalPostPlan(cfg);
    const extraPosts = Math.max(0, (plan.total || 4 * numSections) - (4 * numSections));
    const isMultiSection = numSections > 1 || extraPosts > 0;

    let sqftRate, tierName;
    if (totalSqft < 64) {
      sqftRate = 160;
      tierName = 'Extra-Small Pergola (< 64 sqft)';
    } else if (totalSqft <= 99) {
      sqftRate = 160;
      tierName = 'Extra-Small Pergola (64–99 sqft)';
    } else if (totalSqft <= 119) {
      sqftRate = 150;
      tierName = 'Small Pergola (100–119 sqft)';
    } else if (isMultiSection) {
      sqftRate = 140;
      tierName = 'Multi-Section Pergola';
    } else {
      sqftRate = 130;
      tierName = 'Standard Pergola (4 posts)';
    }

    const basePrice = Math.round(totalSqft * sqftRate);
    lines.push({ label: `${tierName}: ${totalSqft} sqft × $${sqftRate}`, price: basePrice });
    total += basePrice;

    // Extra posts
    if (extraPosts > 0) {
      const tallCount = sections.filter(s => (s.height || 9) >= 10).length;
      const regularCount = Math.max(0, extraPosts - tallCount);
      
      if (regularCount > 0) {
        const regularCost = regularCount * 1200;
        lines.push({ label: `Extra Posts: ${regularCount} × $1,200`, price: regularCost });
        total += regularCost;
      }
      if (tallCount > 0) {
        const tallCost = tallCount * 600;
        lines.push({ label: `Extra-Long Posts (10-13 ft): ${tallCount} × $600`, price: tallCost });
        total += tallCost;
      }
    }

    // Support beam
    if (cfg.style === 'attached') {
      lines.push({ label: 'Support Beam (attached to house)', price: 1200 });
      total += 1200;
    }

    // Louver operation
    if (cfg.louverOperation === 'motorized') {
      const isApp = cfg.louverControlType === 'app';
      const baseCost = 2200 * numSections;
      const opCost = isApp ? baseCost + (700 * numSections) : baseCost;
      const controlLabel = isApp ? 'App Control' : 'Remote Control';
      const suffix = isApp ? `× $2,200 + $700/app` : '× $2,200';
      lines.push({ label: `${controlLabel} Louvers: ${numSections} section(s) ${suffix}`, price: opCost });
      total += opCost;
    }

    // Lighting (per section for multi-section)
    if (cfg.lightColor === 'warm' || cfg.lightColor === 'white') {
      const lightPrice = 2850 * numSections;
      const label = numSections > 1 
        ? `White LED Lights: ${numSections} sections × $2,850` 
        : 'White LED Lights (all 4 sides)';
      lines.push({ label, price: lightPrice });
      total += lightPrice;
    } else if (cfg.lightColor === 'rgb') {
      const lightPrice = 3250 * numSections;
      const label = numSections > 1 
        ? `RGB Lights: ${numSections} sections × $3,250` 
        : 'RGB Color-Changing Lights (all 4 sides)';
      lines.push({ label, price: lightPrice });
      total += lightPrice;
    }

    // Walls ($55/sqft)
    if (cfg.walls?.length > 0) {
      cfg.walls.forEach(w => {
        const side = w.side || '';
        const section = sections.find(s => s.id === w.sectionId) || sections[0] || { length: 12, width: 10, height: 9 };
        const sideLen = (side === 'front' || side === 'back') ? (section.length || 12) : (section.width || 10);
        const height = section.height || 9;
        const sqft = sideLen * height;
        const price = Math.round(sqft * 55);
        lines.push({ label: `Wall — ${side.charAt(0).toUpperCase() + side.slice(1)}: ${sideLen}'×${height}' = ${sqft} sqft × $55`, price });
        total += price;
      });
    }

    // Screens
    if (cfg.screens?.length > 0) {
      const screenOp = cfg.screenOperation || 'remote';
      cfg.screens.forEach(s => {
        const side = s.side || '';
        const section = sections.find(sec => sec.id === s.sectionId) || sections[0] || { length: 12, width: 10, height: 9 };
        const widthFt = (side === 'front' || side === 'back') ? (section.length || 12) : (section.width || 10);
        const heightFt = section.height || 9;
        let price = getScreenPrice(widthFt, heightFt);
        let label = `Screen — ${side.charAt(0).toUpperCase() + side.slice(1)} (${widthFt}'×${heightFt}')`;
        
        if (screenOp === 'manual') {
          price -= 1100;
          label += ' -$1,100 (manual)';
        }
        lines.push({ label, price });
        total += price;
      });
    }
  }

  // Taxes
  const gst = Math.round(total * 0.05 * 100) / 100;
  const pst = Math.round(total * 0.06 * 100) / 100;
  const grandTotal = Math.round((total + gst + pst) * 100) / 100;

  return { lines, subtotal: total, gst, pst, total: grandTotal };
}

function colorName(list, id) {
  return (list.find((c) => c.id === id) || { name: id }).name;
}

const STEP_LABEL_MAP = {
  layout: 'Layout',
  style: 'Style',
  dimensions: 'Size',
  frame: 'Colour',
  walls: 'Walls',
  screens: 'Screens',
  lights: 'Lights',
  'add-ons': 'Add-ons',
};

export default function ReviewStep({ cfg, setCfg, stepNum, total, onJump, compareState, onStartCompare, onFinishSecond, onRestartCompare, onBackToFirst, onResumeSecond }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [targetStepId, setTargetStepId] = useState(null);
  const steps = getSteps(cfg);

  const openModal = (stepId) => {
    setTargetStepId(stepId);
    setModalOpen(true);
  };

  const confirmJump = () => {
    if (targetStepId && onJump) {
      const idx = steps.findIndex((s) => s.id === targetStepId);
      if (idx >= 0) onJump(idx);
    }
    setModalOpen(false);
  };

  const updateNotes = (e) => {
    setCfg((prev) => ({ ...prev, notes: e.target.value }));
  };

  // Use first section for aggregate stats
  const section = cfg.sections[0];
  const plan = totalPostPlan(cfg);
  const sets = louverSetCount(section);
  const lop = louverOperation(section, cfg);
  const sop = screenOperation(section, cfg);

  const rows = [];
  
  // Calculate pricing for display
  const pricing = useMemo(() => calculatePricing(cfg), [cfg]);

  // Layout
  const sectionCount = cfg.sections.length;
  const layoutLabel = cfg.layout === 'l-shape' ? 'L-Shape' : cfg.layout === '10x12-kit' ? '10×12 Standard Kit' : 'Horizontal';
  rows.push({ label: 'Layout', value: `${layoutLabel} (${sectionCount} section${sectionCount > 1 ? 's' : ''})`, stepId: 'layout' });

  // Ground type
  const groundMap = { gravel: 'Gravel', grass: 'Grass / Lawn', concrete: 'Concrete Slab', paving: 'Paving Stones' };
  rows.push({ label: 'Ground Surface', value: groundMap[cfg.groundType] || cfg.groundType, stepId: 'style' });

  // Style
  const styleLabel = cfg.style === 'attached' ? `Attached (on ${cfg.attachedSide})`
    : cfg.style === '10x12-kit' ? '10×12 Kit'
    : 'Freestanding';
  rows.push({ label: 'Style', value: styleLabel, stepId: 'style' });

  // Dimensions
  cfg.sections.forEach((s, i) => {
    rows.push({ label: `Section ${i + 1}`, value: `${s.length} ft × ${s.width} ft × ${s.height} ft`, stepId: 'dimensions' });
  });

  // Frame & Posts
  rows.push({ label: 'Frame', value: colorName(POST_COLORS, cfg.postColor), stepId: 'frame' });
  if (cfg.layout === '10x12-kit') {
    rows.push({ label: 'Post Size', value: cfg.postSize || '4"×4"', stepId: 'style' });
    rows.push({ label: 'Design', value: cfg.design === 'visible-screws' ? 'Visible Screws' : 'Hidden Screws', stepId: 'style' });
  }
  rows.push({ label: 'Posts', value: `${plan.total} total · ${plan.cornerPosts} corner + ${plan.extras} support`, stepId: 'dimensions' });

  // Louvers
  const controlTypeLabel = cfg.louverControlType === 'app' ? 'App' : 'Remote';
  const opLabel = lop === 'manual' ? 'Manual' : `${controlTypeLabel} Control`;
  const louverValue = cfg.layout === '10x12-kit'
    ? `${opLabel} · Preference: we will confirm availability for chosen size`
    : `${sets} set${sets > 1 ? 's' : ''} · ${colorName(LOUVER_COLORS, cfg.louverColor)} · ${opLabel}`;
  rows.push({ label: 'Louvers', value: louverValue, stepId: cfg.layout === '10x12-kit' ? 'dimensions' : 'frame' });

  // Lighting
  if (cfg.layout === '10x12-kit') {
    const sideMap = { 'front-back': '12 ft sides', 'left-right': '10 ft sides', 'all': 'All sides', 'none': 'None' };
    rows.push({ label: 'Lighting', value: cfg.kitLightSides === 'none' ? 'None' : `${colorName(LIGHT_COLORS, cfg.lightColor)} · ${sideMap[cfg.kitLightSides] || '12 ft sides'}`, stepId: 'style' });
  } else {
    rows.push({ label: 'Lighting', value: cfg.lightColor === 'none' ? 'None' : `${colorName(LIGHT_COLORS, cfg.lightColor)} perimeter wrap`, stepId: 'lights' });
  }

  // Screens
  rows.push({
    label: 'Screens',
    value: cfg.screens.length
      ? `${cfg.screens.length} · ${colorName(SCREEN_COLORS, cfg.screenColor)} · ${sop}`
      : 'None',
    stepId: 'screens',
  });

  // Walls
  rows.push({
    label: 'Walls',
    value: cfg.walls.length
      ? cfg.walls
          .map((w) => {
            const sectionNum = cfg.sections.findIndex((s) => s.id === w.sectionId) + 1;
            const sectionLabel = cfg.sections.length > 1 ? `S${sectionNum} ` : '';
            return `${sectionLabel}${w.side} (${colorName(WALL_COLORS, w.color)}${
              w.gap > 0 ? `, ${w.gap.toFixed(1)}in gap` : ''
            })`;
          })
          .join(' · ')
      : 'None',
    stepId: 'walls',
  });

  // Heater placement
  if ((cfg.heaters || []).length > 0) {
    rows.push({
      label: 'Heaters',
      value: cfg.heaters.map((h) => {
        const secNum = cfg.sections.findIndex((s) => s.id === h.sectionId) + 1;
        const prefix = cfg.sections.length > 1 ? `S${secNum} ` : '';
        const section = cfg.sections.find((s) => s.id === h.sectionId);
        const sideLen = section
          ? (h.side === 'front' || h.side === 'back' ? section.length : section.width)
          : 0;
        const num = sideLen > 15 && (h.index ?? 0) > 0 ? ` #${(h.index ?? 0) + 1}` : '';
        return `${prefix}${h.side}${num}`;
      }).join(' · '),
      stepId: 'add-ons',
    });
  }

  // Outlet placement
  if ((cfg.outlets || []).length > 0) {
    rows.push({
      label: 'Outlets',
      value: `${cfg.outlets.length} post${cfg.outlets.length > 1 ? 's' : ''}`,
      stepId: 'add-ons',
    });
  }

  // Add-ons
  const addOns = cfg.addOns || {};
  const addOnParts = [];
  if (addOns.fan) addOnParts.push('Fan');
  if (addOns.tv) addOnParts.push('TV');
  if (addOns.heater) {
    const heaterLabels = { 'wall-mounted': 'Wall-Mounted', hanging: 'Hanging', freestanding: 'Free Standing' };
    const modelMap = {
      'tungsten-electric': { name: 'Tungsten Smart-Heat', fuel: 'Electric' },
      'cobalt-electric': { name: 'Cobalt Smart-Heat', fuel: 'Electric' },
      'platinum-electric': { name: 'Platinum Smart-Heat', fuel: 'Electric' },
      'eclipse-electric-220': { name: 'Eclipse Smart-Heat', fuel: 'Electric' },
      'eclipse-electric-portable': { name: 'Eclipse Smart-Heat', fuel: 'Electric' },
      'tungsten-gas-43k': { name: 'Tungsten Smart-Heat', fuel: 'Gas' },
      'tungsten-gas-portable': { name: 'Tungsten Smart-Heat', fuel: 'Gas' },
    };
    const model = modelMap[addOns.heaterModel] || { name: '', fuel: '' };
    const colorLabel = addOns.heaterColor ? ` · ${addOns.heaterColor.charAt(0).toUpperCase() + addOns.heaterColor.slice(1)}` : '';
    const heaterDesc = `${heaterLabels[addOns.heaterType] || ''} · ${model.fuel} · ${model.name}${colorLabel}`;
    addOnParts.push(`Heater (${heaterDesc})`);
  }
  rows.push({ label: 'Other Add-ons', value: addOnParts.length ? addOnParts.join(' · ') : 'None', stepId: 'add-ons' });

  // Show Apple-style comparison when both configs are ready
  const showComparison = compareState?.showCompareView && compareState?.firstConfig && compareState?.secondConfig;
  
  if (showComparison) {
    return (
      <CompareConfigsView
        firstConfig={compareState.firstConfig}
        secondConfig={compareState.secondConfig}
        onBack={() => {
          // Exit comparison view, return to normal review
          if (onFinishSecond) {
            // This will toggle showCompareView off via parent state update
            onFinishSecond({ toggleOff: true });
          }
        }}
        onNewCompare={onRestartCompare}
      />
    );
  }

  return (
    <div className="pb-fadeup" data-testid="review-step">
      <StepHeader
        stepNum={stepNum}
        total={total}
        title="Review your design"
        subtitle="Looks good? Continue to request your design consultation."
      />
      <div className="pb-card divide-y divide-[#ececea] overflow-hidden">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start justify-between gap-4 px-4 py-3 group">
            <span className="text-[11px] pb-mono uppercase tracking-widest text-[#5b6368] flex-shrink-0">{r.label}</span>
            <div className="flex items-center gap-2 text-right">
              <span className="text-sm font-medium text-[#14171a]">{r.value}</span>
              {r.stepId && onJump && (
                <button
                  type="button"
                  onClick={() => openModal(r.stepId)}
                  className="p-1 rounded hover:bg-[#ececea] text-[#5b6368]"
                  title={`Edit ${r.label}`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pricing Estimate */}
      <div className="mt-4 pb-card overflow-hidden bg-[#f8f9fa]">
        <div className="px-4 py-3 border-b border-[#ececea] bg-white">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#1a7a4b]" />
            <span className="text-[11px] pb-mono uppercase tracking-widest text-[#5b6368]">Estimated Price</span>
          </div>
        </div>
        <div className="divide-y divide-[#ececea]">
          {pricing.lines.map((line, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2">
              <span className="text-sm text-[#5b6368]">{line.label}</span>
              <span className="text-sm font-medium text-[#14171a]">${line.price.toLocaleString()}</span>
            </div>
          ))}
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-sm text-[#5b6368]">Subtotal</span>
            <span className="text-sm font-semibold text-[#14171a]">${pricing.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-sm text-[#5b6368]">GST (5%)</span>
            <span className="text-sm text-[#5b6368]">${pricing.gst.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-sm text-[#5b6368]">PST (6%)</span>
            <span className="text-sm text-[#5b6368]">${pricing.pst.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 bg-[#1a7a4b]/5">
            <span className="text-sm font-semibold text-[#1a7a4b]">Estimated Total</span>
            <span className="text-lg font-bold text-[#1a7a4b]">${pricing.total.toLocaleString()}</span>
          </div>
        </div>
        <p className="px-4 py-2 text-xs text-[#888] bg-white border-t border-[#ececea]">
          Supply only. Not including installation or delivery. Pick-up price. Taxes included in estimate.
        </p>
      </div>

      {/* Notes section */}
      <div className="mt-4 pb-card overflow-hidden">
        <div className="px-4 py-3 border-b border-[#ececea]">
          <span className="text-[11px] pb-mono uppercase tracking-widest text-[#5b6368]">Additional Notes</span>
        </div>
        <div className="p-4">
          <Textarea
            placeholder="Ask about further modifications or any changes you would like..."
            value={cfg.notes || ''}
            onChange={updateNotes}
            className="min-h-[100px] resize-y"
          />
          <p className="text-xs text-[#5b6368] mt-2">
            Any notes you add here will be shared with our design team during your consultation.
          </p>
        </div>
      </div>

      {/* Warning modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Go back to {STEP_LABEL_MAP[targetStepId] || 'edit'}?</DialogTitle>
            <DialogDescription>
              You will be taken back to the <strong>{STEP_LABEL_MAP[targetStepId] || 'selected'}</strong> step.
              Don't worry — you can always click <strong>Review</strong> again in the stepper to skip ahead
              if the change is minor and doesn't affect the whole pergola structure.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium rounded-md border border-[#ececea] text-[#14171a] hover:bg-[#f5f5f3] transition-colors"
            >
              Stay here
            </button>
            <button
              type="button"
              onClick={confirmJump}
              className="px-4 py-2 text-sm font-medium rounded-md bg-[#1a7a4b] text-white hover:bg-[#146b3f] transition-colors"
            >
              Go back
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
