import React from 'react';
import { StepHeader, ColorSwatchRow } from './_shared';
import { LOUVER_COLORS } from '../../data/catalog';
import { louverOperation, louverSetCount, smallerDim } from '../../utils/pergolaRules';
import { Check } from 'lucide-react';

const LOUVER_OPS = [
  { id: 'manual', label: 'Manual', desc: 'Hand-crank control' },
  { id: 'motorized', label: 'Motorized', desc: 'Remote control' },
];

export default function LouversStep({ cfg, setCfg, stepNum, total }) {
  const isKit = cfg.layout === '10x12-kit';
  const section = cfg.sections[0];
  const op = louverOperation(section, cfg);
  const sets = louverSetCount(section);

  const opLabel = op === 'manual' ? 'Manual' : 'Motorized';

  return (
    <div className="pb-fadeup">
      <StepHeader
        stepNum={stepNum}
        total={total}
        title={isKit ? 'Standard Kit Louvers' : 'Choose your louvers'}
        subtitle={isKit ? 'Choose manual or motorized louver operation for the Standard Kit.' : 'Louvers always run across the smaller side of each section. Use the live preview below to open or close them.'}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Stat label="Smaller side" value={`${smallerDim(section)} ft`} />
        <Stat label="Louver sets" value={sets} />
        <Stat label="Operation" value={opLabel} />
      </div>

      {isKit && (
        <>
          <p className="text-[10px] pb-mono uppercase tracking-widest text-[#5b6368] mb-3">Operation</p>
          <div className="flex flex-wrap gap-3 mb-7">
            {LOUVER_OPS.map((o) => (
              <button
                type="button"
                key={o.id}
                onClick={() => setCfg((c) => ({ ...c, louverOperation: o.id }))}
                className={`relative pb-card px-4 py-3 text-left min-w-[100px] transition-all ${
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
                <p className="text-sm font-semibold text-[#14171a]">{o.label}</p>
                <p className={`text-[11px] mt-0.5 ${(cfg.louverOperation || 'manual') === o.id ? 'text-[#1a7a4b]' : 'text-[#5b6368]'}`}>
                  {o.desc}
                </p>
              </button>
            ))}
          </div>
        </>
      )}

      <p className="text-[10px] pb-mono uppercase tracking-widest text-[#5b6368] mb-3">Louver Color</p>
      <ColorSwatchRow
        colors={LOUVER_COLORS}
        value={cfg.louverColor}
        onChange={(id) => setCfg((c) => ({ ...c, louverColor: id }))}
        testIdPrefix="louver-color"
      />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="pb-card px-4 py-3">
      <p className="text-[10px] pb-mono uppercase tracking-widest text-[#5b6368]">{label}</p>
      <p className="pb-display text-xl font-semibold mt-0.5">{value}</p>
    </div>
  );
}
