import React from 'react';
import { StepHeader, ColorSwatchRow } from './_shared';
import { LOUVER_COLORS } from '../../data/catalog';
import { louverOperation, louverSetCount, smallerDim } from '../../utils/pergolaRules';

const LOUVER_OPS = [
  { id: 'manual', label: 'Manual', desc: 'Hand-crank control' },
  { id: 'motorized', label: 'Motorized', desc: 'Remote control' },
  { id: 'phone-controlled', label: 'Phone', desc: 'App-controlled' },
];

export default function LouversStep({ cfg, setCfg, stepNum, total }) {
  const isKit = cfg.layout === '10x12-kit';
  const section = cfg.sections[0];
  const op = louverOperation(section, cfg);
  const sets = louverSetCount(section);

  const opLabel = op === 'manual' ? 'Manual' : op === 'phone-controlled' ? 'Phone' : 'Motorized';

  return (
    <div className="pb-fadeup">
      <StepHeader
        stepNum={stepNum}
        total={total}
        title={isKit ? 'Standard Kit Louvers' : 'Choose your louvers'}
        subtitle={isKit ? 'Louver operation can be any type for the Standard Kit (manual, motorized, or phone).' : 'Louvers always run across the smaller side of each section. Use the live preview below to open or close them.'}
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
                key={o.id}
                onClick={() => setCfg((c) => ({ ...c, kitLouverOperation: o.id }))}
                className={`pb-card px-4 py-3 text-left min-w-[100px] transition-all ${
                  cfg.kitLouverOperation === o.id
                    ? 'ring-2 ring-[#1a7a4b] bg-[#f3f9f5]'
                    : 'hover:border-[#1a7a4b]'
                }`}
              >
                <p className="text-sm font-semibold text-[#14171a]">{o.label}</p>
                <p className="text-[11px] text-[#5b6368] mt-0.5">{o.desc}</p>
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
