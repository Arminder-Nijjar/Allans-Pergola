import React from 'react';
import { StepHeader } from './_shared';
import { LAYOUTS, L_SHAPE_CONFIGS, GROUND_TYPES } from '../../data/catalog';
import { Check } from 'lucide-react';

export default function LayoutStep({ cfg, setCfg, stepNum, total }) {
  const handleLayoutChange = (layoutId) => {
    if (layoutId === 'horizontal') {
      const h = cfg.sections[0]?.height || 9;
      // Preserve existing sections if coming from horizontal-like; otherwise start fresh
      const keepSections = cfg.layout === 'horizontal' && cfg.sections.length > 0;
      setCfg((c) => ({
        ...c,
        layout: 'horizontal',
        sections: keepSections
          ? c.sections.map((s) => ({ ...s, attachTo: s.attachTo || undefined, attachSide: s.attachSide || undefined }))
          : [{ id: 'section-1', length: 12, width: 10, height: h }],
        activeSection: c.sections[0]?.id || 'section-1',
        screens: [],
        walls: [],
      }));
    } else if (layoutId === 'l-shape') {
      const h = cfg.sections[0]?.height || 9;
      setCfg((c) => ({
        ...c,
        layout: 'l-shape',
        sections: [
          { id: 'section-1', length: 20, width: 10, height: h },
          { id: 'section-2', length: 10, width: 20, height: h },
        ],
        activeSection: 'section-1',
        screens: [],
        walls: [],
      }));
    }
  };

  const handleConfigChange = (configId) => {
    setCfg((c) => ({ ...c, lShapeConfig: configId }));
  };

  const handleGroundChange = (groundId) => {
    setCfg((c) => ({ ...c, groundType: groundId }));
  };

  return (
    <div className="pb-fadeup">
      <StepHeader
        stepNum={stepNum}
        total={total}
        title="Choose your layout"
        subtitle="Start with a single pergola or create an L-shaped configuration."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {LAYOUTS.map((layout) => {
          const active = cfg.layout === layout.id;
          return (
            <button
              key={layout.id}
              data-testid={`layout-${layout.id}`}
              onClick={() => handleLayoutChange(layout.id)}
              className={`pb-tile ${active ? 'pb-tile-active' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="pb-display text-xl font-semibold">{layout.label}</span>
                {active && <Check size={18} className="text-[#1a7a4b]" />}
              </div>
              <p className="text-sm text-[#5b6368] leading-snug">{layout.desc}</p>
              <div className="mt-3 flex items-center gap-2">
                <Diagram type={layout.id} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Ground Type */}
      <div className="mt-8">
        <p className="text-[10px] pb-mono uppercase tracking-widest text-[#5b6368] mb-3">
          What is the ground surface?
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {GROUND_TYPES.map((g) => {
            const active = cfg.groundType === g.id;
            return (
              <button
                key={g.id}
                data-testid={`ground-${g.id}`}
                onClick={() => handleGroundChange(g.id)}
                className={`pb-tile text-left ${active ? 'pb-tile-active' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="pb-display text-sm font-semibold">{g.label}</span>
                  {active && <Check size={16} className="text-[#1a7a4b] flex-shrink-0" />}
                </div>
                <p className="text-xs text-[#5b6368] leading-snug">{g.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {cfg.layout === 'l-shape' && (
        <div className="mt-6">
          <p className="text-[10px] pb-mono uppercase tracking-widest text-[#5b6368] mb-3">
            Where should Section 2 attach?
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {L_SHAPE_CONFIGS.map((c) => {
              const active = (cfg.lShapeConfig || 'right-front') === c.id;
              return (
                <button
                  key={c.id}
                  data-testid={`lshape-config-${c.id}`}
                  onClick={() => handleConfigChange(c.id)}
                  className={`px-3 py-2.5 rounded-lg text-xs font-semibold border transition-colors ${
                    active
                      ? 'bg-[#14171a] text-white border-transparent'
                      : 'bg-white text-[#14171a] border-[#d8d8d4] hover:border-[#14171a]'
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          <div className="mt-5 pb-card p-4 bg-[#f3f9f5] border-[#cce4d7]">
            <p className="text-sm text-[#5b6368] leading-relaxed">
              <strong className="text-[#14171a]">L-Shape Configuration:</strong> Two sections forming one seamless structure at 90°.
              Default: 6 structural posts creating 6 outer perimeter segments for walls/screens. Both sections share the same height.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Diagram({ type }) {
  if (type === 'horizontal') {
    return (
      <svg width="86" height="44" viewBox="0 0 86 44">
        <rect x="6" y="6" width="74" height="30" rx="2" fill="#f3f3ef" stroke="#14171a" strokeWidth="1.5" />
        <circle cx="6" cy="6" r="2.5" fill="#14171a" />
        <circle cx="80" cy="6" r="2.5" fill="#14171a" />
        <circle cx="6" cy="36" r="2.5" fill="#14171a" />
        <circle cx="80" cy="36" r="2.5" fill="#14171a" />
      </svg>
    );
  }
  return (
    <svg width="86" height="54" viewBox="0 0 86 54">
      <rect x="6" y="6" width="48" height="22" rx="2" fill="#f3f3ef" stroke="#14171a" strokeWidth="1.5" />
      <circle cx="6" cy="6" r="2.5" fill="#14171a" />
      <circle cx="54" cy="6" r="2.5" fill="#14171a" />
      <circle cx="6" cy="28" r="2.5" fill="#14171a" />
      <circle cx="54" cy="28" r="2.5" fill="#14171a" />
      <rect x="54" y="6" width="26" height="42" rx="2" fill="#e8e6e0" stroke="#14171a" strokeWidth="1.5" />
      <circle cx="80" cy="6" r="2.5" fill="#14171a" />
      <circle cx="80" cy="48" r="2.5" fill="#14171a" />
      <circle cx="54" cy="48" r="2.5" fill="#14171a" />
      <line x1="54" y1="14" x2="54" y2="20" stroke="#1a7a4b" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
