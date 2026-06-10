import React from 'react';
import { StepHeader } from './_shared';
import { POST_COLORS, LOUVER_COLORS, SCREEN_COLORS, WALL_COLORS, LIGHT_COLORS } from '../../data/catalog';
import { totalPostPlan, louverSetCount, louverOperation, screenOperation } from '../../utils/pergolaRules';

function colorName(list, id) {
  return (list.find((c) => c.id === id) || { name: id }).name;
}

export default function ReviewStep({ cfg, stepNum, total }) {
  // Use first section for aggregate stats
  const section = cfg.sections[0];
  const plan = totalPostPlan(cfg);
  const sets = louverSetCount(section);
  const lop = louverOperation(section, cfg);
  const sop = screenOperation(section);

  const rows = [];
  
  // Layout
  const sectionCount = cfg.sections.length;
  const layoutLabel = cfg.layout === 'l-shape' ? 'L-Shape' : cfg.layout === '10x12-kit' ? '10×12 Standard Kit' : 'Horizontal';
  rows.push({ label: 'Layout', value: `${layoutLabel} (${sectionCount} section${sectionCount > 1 ? 's' : ''})` });

  // Ground type
  const groundMap = { gravel: 'Gravel', grass: 'Grass / Lawn', concrete: 'Concrete Slab', paving: 'Paving Stones' };
  rows.push({ label: 'Ground Surface', value: groundMap[cfg.groundType] || cfg.groundType });

  // Style
  const styleLabel = cfg.style === 'attached' ? `Attached (on ${cfg.attachedSide})`
    : cfg.style === '10x12-kit' ? '10×12 Kit'
    : 'Freestanding';
  rows.push({ label: 'Style', value: styleLabel });

  // Dimensions
  cfg.sections.forEach((s, i) => {
    rows.push({ label: `Section ${i + 1}`, value: `${s.length} ft × ${s.width} ft × ${s.height} ft` });
  });
  
  // Frame & Posts
  rows.push({ label: 'Frame', value: colorName(POST_COLORS, cfg.postColor) });
  if (cfg.layout === '10x12-kit') {
    rows.push({ label: 'Post Size', value: cfg.postSize || '4"×4"' });
    rows.push({ label: 'Design', value: cfg.design === 'visible-screws' ? 'Visible Screws' : 'Hidden Screws' });
  }
  rows.push({ label: 'Posts', value: `${plan.total} total · ${plan.cornerPosts} corner + ${plan.extras} support` });
  
  // Louvers
  const opLabel = lop === 'manual' ? 'Manual' : lop === 'phone-controlled' ? 'Phone' : 'Motorized';
  const louverValue = cfg.layout === '10x12-kit'
    ? 'manual (optional: motorized/phone-controlled)'
    : `${sets} set${sets > 1 ? 's' : ''} · ${colorName(LOUVER_COLORS, cfg.louverColor)} · ${opLabel}`;
  rows.push({ label: 'Louvers', value: louverValue });

  // Lighting
  if (cfg.layout === '10x12-kit') {
    const sideMap = { 'front-back': '12 ft sides', 'left-right': '10 ft sides', 'all': 'All sides', 'none': 'None' };
    rows.push({ label: 'Lighting', value: cfg.kitLightSides === 'none' ? 'None' : `${colorName(LIGHT_COLORS, cfg.lightColor)} · ${sideMap[cfg.kitLightSides] || '12 ft sides'}` });
  } else {
    rows.push({ label: 'Lighting', value: cfg.lightColor === 'none' ? 'None' : `${colorName(LIGHT_COLORS, cfg.lightColor)} perimeter wrap` });
  }
  
  // Screens
  rows.push({
    label: 'Screens',
    value: cfg.screens.length
      ? `${cfg.screens.length} · ${colorName(SCREEN_COLORS, cfg.screenColor)} · ${sop}`
      : 'None',
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
  });

  // Add-ons
  const addOns = cfg.addOns || {};
  const addOnParts = [];
  if (addOns.fan) addOnParts.push('Fan');
  if (addOns.tv) addOnParts.push('TV');
  if (addOns.outlets) addOnParts.push('Outlets');
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
  rows.push({ label: 'Add-ons', value: addOnParts.length ? addOnParts.join(' · ') : 'None' });

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
          <div key={r.label} className="flex items-start justify-between gap-4 px-4 py-3">
            <span className="text-[11px] pb-mono uppercase tracking-widest text-[#5b6368] flex-shrink-0">{r.label}</span>
            <span className="text-sm font-medium text-[#14171a] text-right">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
