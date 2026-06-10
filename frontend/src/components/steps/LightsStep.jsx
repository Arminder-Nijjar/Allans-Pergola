import React from 'react';
import { StepHeader } from './_shared';
import { LIGHT_COLORS } from '../../data/catalog';

export default function LightsStep({ cfg, setCfg, stepNum, total }) {
  const isKit = cfg.layout === '10x12-kit';

  return (
    <div className="pb-fadeup">
      <StepHeader
        stepNum={stepNum}
        total={total}
        title={isKit ? 'Standard Kit Lighting' : 'Lighting'}
        subtitle={isKit ? 'Lighting is fixed to the 12 ft sides for the Standard Kit.' : 'LEDs wrap around the entire pergola perimeter automatically, casting warm ambient light both inside and around the pergola.'}
      />

      {isKit && (
        <div className="pb-card p-5 bg-[#f3f9f5] border-[#cce4d7] mb-6">
          <p className="text-sm font-semibold text-[#14171a] mb-3">Standard Kit Lighting</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-[#5b6368]">LED:</span> <strong>Warm White 3200K</strong></div>
            <div><span className="text-[#5b6368]">Type:</span> <strong>Perimeter Wrap</strong></div>
            <div><span className="text-[#5b6368]">Sides:</span> <strong>12 ft Sides (Front + Back)</strong></div>
          </div>
          <p className="text-xs text-[#5b6368] mt-3">Lighting placement is fixed for the Standard Kit.</p>
        </div>
      )}

      {!isKit && (
        <>
          <p className="text-[10px] pb-mono uppercase tracking-widest text-[#5b6368] mb-3">Color</p>
          <div className="flex gap-5 mb-7 flex-wrap">
            {LIGHT_COLORS.map((c) => (
              <button
                key={c.id}
                data-testid={`light-color-${c.id}`}
                onClick={() => setCfg((cf) => ({ ...cf, lightColor: c.id }))}
                className="flex flex-col items-center gap-2"
              >
                <span
                  className={`pb-swatch ${cfg.lightColor === c.id ? 'pb-swatch-active' : ''}`}
                  style={c.hex.startsWith('conic') ? { background: c.hex } : { background: c.hex }}
                />
                <span
                  className={`text-[11px] ${cfg.lightColor === c.id ? 'text-[#14171a] font-semibold' : 'text-[#5b6368]'}`}
                >
                  {c.name}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {cfg.lightColor !== 'none' && !isKit && (
        <div className="pb-card p-5 bg-[#fef9f3] border-[#f0e6d8]">
          <p className="text-sm text-[#5b6368] leading-relaxed">
            <strong className="text-[#14171a]">Perimeter Lighting:</strong> Integrated LED strips run continuously
            along all outer beams, providing elegant ambient lighting that illuminates the interior space and casts
            a soft warm glow onto the ground around the pergola.
          </p>
        </div>
      )}
    </div>
  );
}
