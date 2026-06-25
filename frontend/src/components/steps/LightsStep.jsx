import React from 'react';
import { StepHeader, ColorSwatchRow } from './_shared';
import { LIGHT_COLORS } from '../../data/catalog';
import { Check } from 'lucide-react';

const KIT_LIGHT_SIDES = [
  { id: 'none', label: 'No lights', desc: 'Kit without lighting' },
  { id: 'front-back', label: 'Front + Back', desc: '12 ft sides' },
];

export default function LightsStep({ cfg, setCfg, stepNum, total }) {
  const isKit = cfg.layout === '10x12-kit';
  const kitSides = cfg.kitLightSides || 'front-back';

  // Switch to night mode, close louvers, and set top-down camera for easy light viewing
  React.useEffect(() => {
    setCfg((c) => ({
      ...c,
      isNight: true,
      louverRotation: 0,
      cameraPreset: 'top-down',
    }));
    return () => {
      setCfg((c) => ({ ...c, isNight: false, cameraPreset: null }));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="pb-fadeup">
      <StepHeader
        stepNum={stepNum}
        total={total}
        title={isKit ? 'Standard Kit Lighting' : 'Lighting'}
        subtitle={isKit ? 'Choose light placement for the Standard Kit.' : 'LEDs wrap around the entire pergola perimeter automatically, casting warm ambient light both inside and around the pergola.'}
      />

      {isKit && (
        <>
          <p className="text-[10px] pb-mono uppercase tracking-widest text-[#5b6368] mb-3">Placement</p>
          <div className="flex flex-wrap gap-3 mb-7">
            {KIT_LIGHT_SIDES.map((o) => (
              <button
                type="button"
                key={o.id}
                onClick={() => setCfg((c) => ({ ...c, kitLightSides: o.id }))}
                className={`relative pb-card px-4 py-3 text-left min-w-[100px] transition-all flex-1 sm:flex-none ${
                  kitSides === o.id
                    ? 'bg-[#e6f3eb] border-[#1a7a4b] shadow-sm'
                    : 'bg-white hover:border-[#1a7a4b]'
                }`}
              >
                {kitSides === o.id && (
                  <span className="absolute top-2 right-2">
                    <Check size={14} className="text-[#1a7a4b]" />
                  </span>
                )}
                <p className="text-sm font-semibold text-[#14171a]">{o.label}</p>
                <p className={`text-[11px] mt-0.5 ${kitSides === o.id ? 'text-[#1a7a4b]' : 'text-[#5b6368]'}`}>
                  {o.desc}
                </p>
              </button>
            ))}
          </div>

          {kitSides !== 'none' && (
            <>
              <p className="text-[10px] pb-mono uppercase tracking-widest text-[#5b6368] mb-3">Color</p>
              <div className="flex gap-5 mb-7 flex-wrap">
                {LIGHT_COLORS.filter((c) => c.id !== 'none').map((c) => (
                  <button
                    type="button"
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
        </>
      )}

      {!isKit && (
        <>
          <p className="text-[10px] pb-mono uppercase tracking-widest text-[#5b6368] mb-3">Color</p>
          <ColorSwatchRow
            colors={LIGHT_COLORS}
            value={cfg.lightColor}
            onChange={(id) => setCfg((c) => ({ ...c, lightColor: id }))}
            testIdPrefix="light-color"
          />
          <p className="text-[11px] text-[#5b6368] mt-2">
            RGB mode lets you change to any color using the remote or app.
          </p>
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
