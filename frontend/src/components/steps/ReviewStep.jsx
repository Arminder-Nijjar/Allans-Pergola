import React, { useState } from 'react';
import { Pencil } from 'lucide-react';
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
  const opLabel = lop === 'manual' ? 'Manual' : lop === 'phone-controlled' ? 'Phone' : 'Motorized';
  const louverValue = cfg.layout === '10x12-kit'
    ? 'manual (optional: motorized/phone-controlled)'
    : `${sets} set${sets > 1 ? 's' : ''} · ${colorName(LOUVER_COLORS, cfg.louverColor)} · ${opLabel}`;
  rows.push({ label: 'Louvers', value: louverValue, stepId: 'frame' });

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
