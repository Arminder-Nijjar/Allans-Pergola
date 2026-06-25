import React from 'react';
import { StepHeader } from './_shared';
import { STYLES, SIDES, GROUND_TYPES } from '../../data/catalog';
import { isSideFullyInterior } from '../../utils/pergolaLayout';
import { Check, Shovel, Home } from 'lucide-react';

export default function StyleStep({ cfg, setCfg, stepNum, total }) {
  const handleGroundChange = (groundId) => {
    setCfg((c) => ({ ...c, groundType: groundId }));
  };

  const handleStyleChange = (styleId) => {
    if (styleId === '10x12-kit') {
      setCfg((c) => ({
        ...c,
        style: '10x12-kit',
        layout: '10x12-kit',
        // Kit dimensions are fixed: always reset to a single 12x10x9 section
        sections: [{ id: 'section-1', length: 12, width: 10, height: 9 }],
        activeSection: 'section-1',
        postColor: 'umbra-grey',
        louverColor: 'pure-white',
        lightColor: 'warm',
        screenColor: 'white',
        wallColor: 'white',
        design: 'visible-screws',
        postSize: '4x4',
        louverOperation: 'motorized',
        kitLouverOperation: 'motorized',
        screenOperation: 'manual',
        kitLightSides: 'front-back',
        screens: [],
        walls: [],
        extraPostPositions: {},
        optionalExtraPosts: {},
      }));
    } else {
      setCfg((c) => ({
        ...c,
        style: styleId,
        layout: c.layout === '10x12-kit' ? 'horizontal' : c.layout,
        sections: c.layout === '10x12-kit'
          ? [{ id: 'section-1', length: 12, width: 10, height: 9 }]
          : c.sections,
        activeSection: 'section-1',
        // Freestanding has no house wall: drop walls/screens stuck on the old attached side
        walls: styleId === 'freestanding' ? c.walls : c.walls.filter((w) => w.side !== c.attachedSide),
        screens: styleId === 'freestanding' ? c.screens : c.screens.filter((s) => s.side !== c.attachedSide),
      }));
    }
  };

  return (
    <div className="pb-fadeup">
      <StepHeader
        stepNum={stepNum}
        total={total}
        title="How does it sit?"
        subtitle="Stands alone, attaches to your house, or pick the ready-made kit."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {STYLES.map((s) => {
          const active = cfg.style === s.id;
          return (
            <button
              key={s.id}
              data-testid={`style-${s.id}`}
              onClick={() => handleStyleChange(s.id)}
              className={`pb-tile ${active ? 'pb-tile-active' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="pb-display text-xl font-semibold">{s.label}</span>
                {active && <Check size={18} className="text-[#1a7a4b]" />}
              </div>
              <p className="text-sm text-[#5b6368] leading-snug">{s.desc}</p>
              <div className="mt-3 flex items-center gap-2">
                <Diagram type={s.id} />
              </div>
            </button>
          );
        })}
      </div>

      {cfg.style === 'attached' && (
        <div className="mt-6">
          <p className="text-sm font-semibold text-[#14171a] mb-2 flex items-center gap-2">
            <Home size={16} className="text-[#1a7a4b]" />
            Which side touches your house?
          </p>
          <div className="grid grid-cols-4 gap-2">
            {SIDES.map((s) => {
              const active = cfg.attachedSide === s.id;
              return (
                <button
                  key={s.id}
                  data-testid={`attached-side-${s.id}`}
                  onClick={() => setCfg((c) => {
                    const newAttachedSide = s.id;
                    return {
                      ...c,
                      attachedSide: newAttachedSide,
                      // The house wall is rendered automatically on the attached side.
                      // Remove any user walls/screens that now sit on that side.
                      walls: c.walls.filter((w) => w.side !== newAttachedSide),
                      screens: c.screens.filter((sc) => sc.side !== newAttachedSide),
                    };
                  })}
                  className={`px-3 py-2.5 rounded-full text-sm font-semibold border transition-colors ${
                    active ? 'bg-[#14171a] text-white border-transparent' : 'bg-white text-[#14171a] border-[#d8d8d4] hover:border-[#14171a]'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-[#5b6368] mt-3">
            A wall will be added to all sections on this side. Posts touching the wall will be removed.
          </p>
        </div>
      )}

      {/* Ground Type */}
      <div className="mt-8 pb-card p-5 bg-[#f7f8f5] border-[#d8d8d4]">
        <div className="flex items-center gap-2 mb-4">
          <Shovel size={18} className="text-[#1a7a4b]" />
          <p className="text-sm font-semibold text-[#14171a]">
            What is the ground surface?
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
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
    </div>
  );
}

function Diagram({ type }) {
  if (type === 'freestanding') {
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
  if (type === '10x12-kit') {
    return (
      <svg width="86" height="52" viewBox="0 0 86 52">
        <rect x="10" y="6" width="66" height="40" rx="2" fill="#f3f9f5" stroke="#1a7a4b" strokeWidth="2" />
        <circle cx="10" cy="6" r="2.5" fill="#1a7a4b" />
        <circle cx="76" cy="6" r="2.5" fill="#1a7a4b" />
        <circle cx="10" cy="46" r="2.5" fill="#1a7a4b" />
        <circle cx="76" cy="46" r="2.5" fill="#1a7a4b" />
        <text x="43" y="29" fontSize="10" fontWeight="bold" fill="#1a7a4b" textAnchor="middle" dominantBaseline="middle">10×12</text>
      </svg>
    );
  }
  return (
    <svg width="86" height="44" viewBox="0 0 86 44">
      <rect x="0" y="0" width="86" height="6" fill="#c9bba0" />
      <rect x="6" y="10" width="74" height="28" rx="2" fill="#f3f3ef" stroke="#14171a" strokeWidth="1.5" />
      <circle cx="6" cy="38" r="2.5" fill="#14171a" />
      <circle cx="80" cy="38" r="2.5" fill="#14171a" />
    </svg>
  );
}
