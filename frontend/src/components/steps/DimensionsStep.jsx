import React, { useMemo } from 'react';
import { StepHeader, NumberSlider } from './_shared';
import { LIMITS } from '../../data/catalog';
import { postPlan, louverSetCount, louverOperation, isAttachedSide } from '../../utils/pergolaRules';
import { RotateCw, ArrowRightLeft, Plus, Check } from 'lucide-react';
import { PostSlider } from './PostSlider';

export default function DimensionsStep({ cfg, setCfg, stepNum, total }) {
  const updateSection = (sectionId, patch) => {
    setCfg((c) => {
      const section = c.sections.find((s) => s.id === sectionId);
      if (!section) return c;

      let newLength = 'length' in patch ? patch.length : section.length;
      let newWidth = 'width' in patch ? patch.width : section.width;

      // ENFORCE: Only one dimension can exceed 20ft
      // If length >= 21, cap width at 20
      // If width >= 21, cap length at 20
      if (newLength > 20 && newWidth > 20) {
        // Both can't be >20, keep the one being changed
        if ('length' in patch && !('width' in patch)) {
          newWidth = Math.min(newWidth, 20);
        } else if ('width' in patch && !('length' in patch)) {
          newLength = Math.min(newLength, 20);
        }
      }

      const updatedPatch = {
        ...patch,
        length: clampLen(newLength),
        width: clampWidth(newWidth),
      };

      // If height changed and layout is l-shape, sync height to all sections only
      if ('height' in patch && c.layout === 'l-shape') {
        return {
          ...c,
          sections: c.sections.map((s) => ({ ...s, height: patch.height })),
        };
      }
      return {
        ...c,
        sections: c.sections.map((s) => (s.id === sectionId ? { ...s, ...updatedPatch } : s)),
      };
    });
  };

  const rotateSection = (sectionId) => {
    setCfg((c) => ({
      ...c,
      sections: c.sections.map((s) => {
        if (s.id !== sectionId) return s;
        // Swap length and width, then clamp BOTH to valid range
        // Valid range must satisfy BOTH length (8-20) AND width (8-30) constraints
        const newLen = clampBoth(s.width);
        const newWidth = clampBoth(s.length);
        return { ...s, length: newLen, width: newWidth };
      }),
    }));
  };

  const setActiveSection = (sectionId) => {
    setCfg((c) => ({ ...c, activeSection: sectionId }));
  };

  const updateExtraPostPosition = (positionKey, value) => {
    setCfg((c) => ({
      ...c,
      extraPostPositions: {
        ...c.extraPostPositions,
        [positionKey]: value,
      },
    }));
  };

  const togglePostRemoval = (postKey) => {
    setCfg((c) => {
      const removed = new Set(c.removedPostKeys || []);
      if (removed.has(postKey)) {
        removed.delete(postKey);
      } else {
        removed.add(postKey);
      }
      return { ...c, removedPostKeys: Array.from(removed) };
    });
  };

  const addOptionalExtraPost = (sectionId, side) => {
    setCfg((c) => {
      const currentOptional = c.optionalExtraPosts || {};
      const sectionOptional = { ...(currentOptional[sectionId] || {}) };
      const currentCount = sectionOptional[side] || 0;
      const newCount = currentCount + 1;

      const section = c.sections.find((s) => s.id === sectionId);
      if (!section) return c;

      const isHoriz = side === 'front' || side === 'back';
      const sideLength = isHoriz ? section.length : section.width;
      const isMandatory = sideLength >= LIMITS.extraSupportThreshold;
      const totalPosts = (isMandatory ? 1 : 0) + newCount;
      const newIndex = totalPosts - 1; // 0-based index of the new post
      const defaultPos = sideLength * (newIndex + 1) / (totalPosts + 1);
      const positionKey = `${sectionId}-${side}-${newIndex}`;

      sectionOptional[side] = newCount;

      return {
        ...c,
        optionalExtraPosts: {
          ...currentOptional,
          [sectionId]: sectionOptional,
        },
        extraPostPositions: {
          ...c.extraPostPositions,
          [positionKey]: defaultPos,
        },
      };
    });
  };

  const removeOptionalExtraPost = (sectionId, side, index) => {
    setCfg((c) => {
      const currentOptional = c.optionalExtraPosts || {};
      const sectionOptional = { ...(currentOptional[sectionId] || {}) };
      const currentCount = sectionOptional[side] || 0;
      if (currentCount <= 0) return c;

      const newCount = currentCount - 1;
      if (newCount === 0) {
        delete sectionOptional[side];
      } else {
        sectionOptional[side] = newCount;
      }

      // Renumber position keys: delete removed, shift higher indices down
      const prefix = `${sectionId}-${side}-`;
      const newPositions = { ...c.extraPostPositions };
      delete newPositions[`${prefix}${index}`];

      const shiftKeys = Object.keys(newPositions)
        .filter((k) => k.startsWith(prefix))
        .map((k) => ({ key: k, idx: parseInt(k.slice(prefix.length), 10) }))
        .filter(({ idx }) => !isNaN(idx) && idx > index)
        .sort((a, b) => a.idx - b.idx);

      for (const { key, idx } of shiftKeys) {
        const newKey = `${prefix}${idx - 1}`;
        newPositions[newKey] = newPositions[key];
        delete newPositions[key];
      }

      return {
        ...c,
        optionalExtraPosts: {
          ...currentOptional,
          [sectionId]: sectionOptional,
        },
        extraPostPositions: newPositions,
      };
    });
  };

  const isMultiSection = cfg.sections.length > 1;
  const isHorizontalLike = cfg.layout === 'horizontal' || cfg.layout === '10x12-kit';
  const showTabs = cfg.layout === 'l-shape' || (isHorizontalLike && isMultiSection);
  const showAll = isHorizontalLike && !isMultiSection;

  const isKit = cfg.layout === '10x12-kit';

  return (
    <div className="pb-fadeup">
      <StepHeader
        stepNum={stepNum}
        total={total}
        title={isKit ? 'Standard Kit' : 'Set your dimensions'}
        subtitle={isKit ? '10×12 ft Standard Kit — dimensions are fixed.' : 'Both dimensions 8-30 ft. Only ONE can exceed 20 ft (the other locks at 20).'}
      />

      {isKit && (
        <div className="pb-card p-5 bg-[#f3f9f5] border-[#cce4d7] mb-6">
          <p className="text-sm font-semibold text-[#14171a] mb-3">Standard Kit Specifications</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-[#5b6368]">Size:</span> <strong>12 ft × 10 ft</strong></div>
            <div><span className="text-[#5b6368]">Height:</span> <strong>9 ft</strong></div>
            <div><span className="text-[#5b6368]">Posts:</span> <strong>4"×4"</strong></div>
            <div><span className="text-[#5b6368]">Design:</span> <strong>Visible Screws</strong></div>
          </div>
          <p className="text-xs text-[#5b6368] mt-3">These specifications are fixed for the Standard Kit and cannot be changed.</p>
        </div>
      )}

      {!isKit && showTabs && (
        <div className="flex gap-2 mb-4">
          {cfg.sections.map((section, idx) => (
            <button
              key={section.id}
              data-testid={`section-tab-${idx + 1}`}
              onClick={() => setActiveSection(section.id)}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                cfg.activeSection === section.id
                  ? 'bg-[#1a7a4b] text-white border-transparent'
                  : 'bg-white text-[#14171a] border-[#d8d8d4] hover:border-[#1a7a4b]'
              }`}
            >
              Section {idx + 1}
            </button>
          ))}
        </div>
      )}

      {!isKit && (
        <div className="space-y-6">
          {cfg.sections.map((section) => (
            <SectionDimensions
              key={section.id}
              section={section}
              cfg={cfg}
              isActive={cfg.activeSection === section.id}
              showAll={showAll}
              onUpdate={(patch) => updateSection(section.id, patch)}
              onRotate={() => rotateSection(section.id)}
              onPostPositionChange={updateExtraPostPosition}
              onAddOptionalPost={(side) => addOptionalExtraPost(section.id, side)}
              onRemoveOptionalPost={(side, index) => removeOptionalExtraPost(section.id, side, index)}
              onTogglePostRemoval={togglePostRemoval}
              setCfg={setCfg}
            />
          ))}
        </div>
      )}

      {/* Louver Operation — shown for all styles */}
      <div className="mt-6 pb-card p-4 md:p-6">
        <p className="text-sm font-semibold text-[#14171a] mb-3">Louver Operation</p>
        <div className="flex flex-wrap gap-3">
          {[
            { id: 'manual', label: 'Manual', desc: 'Hand-crank control' },
            { id: 'motorized', label: 'Motorized', desc: 'Remote control' },
          ].map((o) => (
            <button
              type="button"
              key={o.id}
              onClick={() => setCfg((c) => ({ ...c, louverOperation: o.id }))}
              className={`relative pb-card px-4 py-3 text-left min-w-[100px] transition-all flex-1 sm:flex-none ${
                (cfg.louverOperation || 'manual') === o.id
                  ? 'bg-[#e6f3eb] border-[#1a7a4b] shadow-sm'
                  : 'bg-white hover:border-[#1a7a4b]'
              }`}
            >
              {(cfg.louverOperation || 'manual') === o.id && (
                <span className="absolute top-2 right-2">
                  <Check size={14} className="text-[#1a7a4b]" />
                </span>
              )}
              <p className="text-sm font-semibold text-[#14171a]">
                {o.label}
              </p>
              <p className={`text-[11px] mt-0.5 ${(cfg.louverOperation || 'manual') === o.id ? 'text-[#1a7a4b]' : 'text-[#5b6368]'}`}>
                {o.desc}
              </p>
            </button>
          ))}
        </div>
        <p className="text-xs text-[#5b6368] mt-3 bg-[#f8f9fa] border border-[#ececea] rounded-lg p-3">
          This is a customer preference. We will confirm if motorized louvers are available for the chosen size.
        </p>

        {/* Control Type — only shown when motorized is selected */}
        {cfg.louverOperation === 'motorized' && (
          <div className="mt-4 pt-4 border-t border-[#ececea]">
            <p className="text-sm font-semibold text-[#14171a] mb-3">Control Type</p>
            <div className="flex flex-wrap gap-3">
              {[
                { id: 'remote', label: 'Remote Control', desc: 'Standard remote — $2,200 per section' },
                { id: 'app', label: 'App Control', desc: 'Smartphone app +$700 — $2,900 per section' },
              ].map((o) => (
                <button
                  type="button"
                  key={o.id}
                  onClick={() => setCfg((c) => ({ ...c, louverControlType: o.id }))}
                  className={`relative pb-card px-4 py-3 text-left min-w-[140px] transition-all flex-1 sm:flex-none ${
                    (cfg.louverControlType || 'remote') === o.id
                      ? 'bg-[#e6f3eb] border-[#1a7a4b] shadow-sm'
                      : 'bg-white hover:border-[#1a7a4b]'
                  }`}
                >
                  {(cfg.louverControlType || 'remote') === o.id && (
                    <span className="absolute top-2 right-2">
                      <Check size={14} className="text-[#1a7a4b]" />
                    </span>
                  )}
                  <p className="text-sm font-semibold text-[#14171a]">{o.label}</p>
                  <p className={`text-[11px] mt-0.5 ${(cfg.louverControlType || 'remote') === o.id ? 'text-[#1a7a4b]' : 'text-[#5b6368]'}`}>
                    {o.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

function clampLen(v) {
  return Math.max(LIMITS.length.min, Math.min(LIMITS.length.max, v));
}
function clampWidth(v) {
  return Math.max(LIMITS.width.min, Math.min(LIMITS.width.max, v));
}
// Clamp to range that satisfies BOTH length and width constraints
// This prevents the "rotate then extend beyond limits" bug
function clampBoth(v) {
  const min = Math.max(LIMITS.length.min, LIMITS.width.min); // 8
  const max = Math.min(LIMITS.length.max, LIMITS.width.max); // 20
  return Math.max(min, Math.min(max, v));
}

function SectionDimensions({ section, cfg, isActive, showAll, setCfg, onUpdate, onRotate, onPostPositionChange, onAddOptionalPost, onRemoveOptionalPost, onTogglePostRemoval }) {
  const plan = useMemo(() => postPlan(cfg, section.id), [cfg, section]);
  const sets = useMemo(() => louverSetCount(section), [section]);
  const op = useMemo(() => louverOperation(section, cfg), [section, cfg]);

  if (!showAll && !isActive) return null;

  // Get optional extra posts for this section: { side: count }
  const optionalExtraPosts = cfg.optionalExtraPosts || {};
  const sectionOptional = optionalExtraPosts[section.id] || {};

  // All sides that can have accessory posts (non-attached only)
  const allSides = ['front', 'back', 'left', 'right'];
  const availableSides = allSides.filter((side) => {
    if (isAttachedSide(cfg, section.id, side)) return false;
    return true;
  });

  // Separate mandatory and optional posts from plan.extraPosts
  const mandatoryPosts = plan.extraPosts.filter((p) => p.isMandatory);
  const optionalPosts = plan.extraPosts.filter((p) => !p.isMandatory);

  const sectionLabel = cfg.sections.length > 1 ? `Section ${section.id.split('-')[1]}` : null;

  return (
    <div data-testid={`section-${section.id}`}>
      {sectionLabel && (
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-base font-semibold text-[#14171a] pb-display">{sectionLabel}</h3>
          {isActive && (
            <span className="text-[10px] uppercase tracking-widest text-[#1a7a4b] font-bold bg-[#e6f3eb] px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </div>
      )}

      <div className="pb-card p-4 md:p-6">
      {(() => {
        const lenMax = section.width > 20 ? 20 : LIMITS.length.max;
        const widthMax = section.length > 20 ? 20 : LIMITS.width.max;
        return (
          <>
            <DimensionField
              testId={`dim-length-${section.id}`}
              label="Length"
              description={section.width > 20 ? "Max 20' (width is >20)" : "Front to back (8-30')"}
              unit="ft"
              value={section.length}
              min={LIMITS.length.min}
              max={lenMax}
              step={LIMITS.length.step}
              onChange={(v) => onUpdate({ length: v })}
            />
            <div className="h-px bg-[#ececea] my-1" />
            <DimensionField
              testId={`dim-width-${section.id}`}
              label="Width"
              description={section.length > 20 ? "Max 20' (length is >20)" : "Side to side (8-30')"}
              unit="ft"
              value={section.width}
              min={LIMITS.width.min}
              max={widthMax}
              step={LIMITS.width.step}
              onChange={(v) => onUpdate({ width: v })}
            />
            <div className="h-px bg-[#ececea] my-1" />
            <DimensionField
              testId={`dim-height-${section.id}`}
              label={cfg.layout === 'l-shape' ? 'Height (synced)' : 'Height'}
              description="Post height from ground to beam"
              unit="ft"
              value={section.height}
              min={LIMITS.height.min}
              max={LIMITS.height.max}
              step={LIMITS.height.step}
              onChange={(v) => onUpdate({ height: v })}
            />
          </>
        );
      })()}
      </div>

      {/* Mandatory extra posts (sides ≥ 15 ft) */}
      {(mandatoryPosts.length > 0 || plan.removedMandatoryPosts?.length > 0) && (
        <div className="mt-4 pb-card p-4 md:p-6">
          <p className="text-sm font-semibold text-[#14171a] mb-4">
            Extra Support Posts (sides ≥ 15 ft)
          </p>
          <div className="space-y-1">
            {mandatoryPosts.map((post) => (
              <PostSlider
                key={post.positionKey}
                side={post.side}
                section={section}
                cfg={cfg}
                positionKey={post.positionKey}
                isMandatory={true}
                onRemove={() => onTogglePostRemoval(post.positionKey)}
                onPositionChange={(value) => onPostPositionChange(post.positionKey, value)}
              />
            ))}
            {/* Removed but still recommended posts */}
            {plan.removedMandatoryPosts?.map((post) => {
              const sideLabel = { front: 'Front', back: 'Back', left: 'Left', right: 'Right' }[post.side];
              return (
                <div key={post.positionKey} className="py-3 rounded-lg border-b border-[#e5e5e0] last:border-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#14171a]">
                          {sideLabel} Support Post
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#c98a2a] bg-[#fff8e6] px-1.5 py-0.5 rounded">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5b6368] mt-0.5">
                        {post.position.toFixed(1)} ft — Side is {section[post.side === 'front' || post.side === 'back' ? 'length' : 'width']} ft (≥ 15 ft)
                      </p>
                    </div>
                    <button
                      onClick={() => onTogglePostRemoval(post.positionKey)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors bg-[#e6f3eb] text-[#1a7a4b] border-[#cce4d7] hover:bg-[#d4eadc]"
                    >
                      <Plus size={13} />
                      Re-add
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Optional extra posts section */}
      <div className="mt-4 pb-card p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-[#14171a]">Accessory Posts</p>
          <span className="text-[11px] text-[#5b6368]">Min 4 ft from corners/posts</span>
        </div>

        {optionalPosts.length > 0 && (
          <div className="space-y-1 mb-4">
            {optionalPosts.map((post) => (
              <PostSlider
                key={post.positionKey}
                side={post.side}
                section={section}
                cfg={cfg}
                positionKey={post.positionKey}
                isMandatory={false}
                onRemove={() => onRemoveOptionalPost(post.side, post.index)}
                onPositionChange={(value) => onPostPositionChange(post.positionKey, value)}
              />
            ))}
          </div>
        )}

        {/* Add optional post buttons — show count on each side */}
        {availableSides.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {availableSides.map((side) => {
              const count = sectionOptional[side] || 0;
              const sideLabel = { front: 'Front', back: 'Back', left: 'Left', right: 'Right' }[side];
              return (
                <button
                  key={side}
                  onClick={() => onAddOptionalPost(side)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium border transition-colors bg-white text-[#14171a] border-[#d8d8d4] hover:border-[#1a7a4b]"
                >
                  + {sideLabel} {count > 0 ? `(${count})` : ''}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3" data-testid={`auto-info-${section.id}`}>
        <Info label="Total Posts" value={plan.total} suffix={`(4 corners + ${plan.extras} mid)`} />
        <Info label="Louver Sets" value={sets} suffix={sets > 1 ? 'auto-split' : 'single span'} />
        <Info 
          label="Operation" 
          value={op === 'manual' ? 'Hand-crank' : (cfg.louverControlType === 'app' ? 'App Control' : 'Remote Control')} 
          suffix={op === 'motorized' ? (cfg.louverControlType === 'app' ? 'Smartphone app (+$700)' : 'Standard remote') : 'Manual crank'} 
        />
      </div>
    </div>
  );
}

function Info({ label, value, suffix }) {
  return (
    <div className="pb-card px-4 py-3">
      <p className="text-[10px] pb-mono uppercase tracking-widest text-[#5b6368]">{label}</p>
      <p className="pb-display text-2xl font-semibold text-[#14171a] leading-none mt-1">{value}</p>
      {suffix && <p className="text-[11px] text-[#5b6368] mt-0.5">{suffix}</p>}
    </div>
  );
}

function RotateButton({ onRotate, isSwapped }) {
  return (
    <button
      onClick={onRotate}
      className={`group flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all duration-200 border-2 ${
        isSwapped
          ? 'bg-[#1a7a4b] text-white border-[#1a7a4b] hover:bg-[#156b3d]'
          : 'bg-white text-[#1a7a4b] border-[#1a7a4b] hover:bg-[#e6f3eb]'
      }`}
      title="Swap Length & Width (rotate 90°)"
    >
      <div className="flex items-center gap-1">
        <ArrowRightLeft size={16} className="transition-transform group-hover:rotate-180 duration-300" />
        <RotateCw size={14} />
      </div>
      <span className="text-sm">{isSwapped ? 'Swapped' : 'Swap'}</span>
    </button>
  );
}

function DimensionField({ testId, label, description, unit, value, min, max, step, onChange }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="py-3 rounded-lg">
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-sm font-semibold text-[#14171a]">
            {label}
          </span>
          <p className="text-[11px] text-[#5b6368] mt-0.5">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!Number.isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
            }}
            data-testid={`${testId}-input`}
            className="w-16 px-2 py-1.5 text-right text-sm pb-mono font-semibold rounded-md border border-[#d8d8d4] bg-white focus:outline-none focus:border-[#1a7a4b]"
          />
          <span className="text-xs text-[#5b6368]">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="pb-range w-full"
        style={{ '--pb-pct': `${pct}%` }}
        data-testid={`${testId}-range`}
      />
      <div className="flex justify-between mt-1">
        <span className="text-[10px] pb-mono text-[#5b6368]">{min} {unit}</span>
        <span className="text-[10px] pb-mono text-[#5b6368]">{max} {unit}</span>
      </div>
    </div>
  );
}
