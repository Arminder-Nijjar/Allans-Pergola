import React from 'react';
import { StepHeader } from './_shared';
import { Check } from 'lucide-react';

export const HEATER_TYPES = [
  { id: 'wall-mounted', label: 'Wall-Mounted' },
  { id: 'hanging', label: 'Hanging' },
  { id: 'freestanding', label: 'Free Standing' },
];

export const HEATER_MODELS = [
  {
    id: 'tungsten-electric',
    label: 'Tungsten Smart-Heat',
    fuel: 'Electric',
    spec: '3000-6000W\n208-240V',
    img: 'https://www.bromic.ca/wp-content/uploads/2025/04/tungelec_Stacked-500x500.png',
    needsColor: true,
    types: ['wall-mounted'],
  },
  {
    id: 'platinum-electric',
    label: 'Platinum Smart-Heat',
    fuel: 'Electric',
    spec: '3400-4500W\n208-240V',
    img: 'https://www.bromic.ca/wp-content/uploads/sites/3/2025/05/Platinum.png',
    needsColor: true,
    types: ['wall-mounted'],
  },
  {
    id: 'tungsten-gas-43k',
    label: 'Tungsten Smart-Heat',
    fuel: 'Gas',
    spec: '43,000 BTU\nNG or LPG',
    img: 'https://premiumbackyard.ca/cdn/shop/files/BromicPlatinum500GasRadiantHeater_40_000BTU_f26ec319-4519-4c54-ad20-d16d8dd8b70f_800x800.jpg?v=1755919847',
    types: ['wall-mounted'],
  },
  {
    id: 'cobalt-electric',
    label: 'Cobalt Smart-Heat',
    fuel: 'Electric',
    spec: '4000-6000W',
    img: 'https://m.media-amazon.com/images/I/31vHsc-STHL._AC_UF894,1000_QL80_.jpg',
    types: ['wall-mounted'],
  },
  {
    id: 'eclipse-electric-220',
    label: 'Eclipse Smart-Heat',
    fuel: 'Electric',
    spec: '2900W\n220-240V',
    img: 'https://signatureradiant.ca/cdn/shop/files/BROMIC_ECLIPSE-CEILING-600mm-DBL-ON-dimout_1_72334086-b576-47c2-afc4-8e2d50511923.png?v=1755267175&width=990',
    types: ['hanging'],
  },
  {
    id: 'tungsten-gas-portable',
    label: 'Tungsten Smart-Heat',
    fuel: 'Gas',
    spec: '38,500 BTU\nNG or LPG',
    img: 'https://signatureradiant.ca/cdn/shop/files/Bromic_Tungsten_Portable.jpg?v=1756493011&width=990',
    types: ['freestanding'],
  },
  {
    id: 'eclipse-electric-portable',
    label: 'Eclipse Smart-Heat',
    fuel: 'Electric',
    spec: '2900W\n220-240V',
    img: 'https://signatureradiant.ca/cdn/shop/files/Eclipse_Portable_Primary_Shadow_4947f878-f8a3-4b23-b0ee-14fdc02304ef.png?v=1756473860&width=990',
    types: ['freestanding'],
  },
];

export default function AddOnsStep({ cfg, setCfg, stepNum, total }) {
  const addOns = cfg.addOns || {};
  const toggleAddOn = (key) => {
    setCfg((c) => ({
      ...c,
      addOns: { ...(c.addOns || {}), [key]: !(c.addOns || {})[key] },
    }));
  };

  const updateHeater = (patch) => {
    setCfg((c) => ({
      ...c,
      addOns: {
        ...(c.addOns || {}),
        heater: true,
        heaterType: patch.heaterType ?? c.addOns?.heaterType,
        heaterModel: patch.heaterModel ?? c.addOns?.heaterModel,
        heaterColor: patch.heaterColor ?? c.addOns?.heaterColor,
      },
    }));
  };

  return (
    <div className="pb-fadeup">
      <StepHeader
        stepNum={stepNum}
        total={total}
        title="Add-ons & Accessories"
        subtitle="Enhance your pergola with fans, TVs, outlets, and heaters designed for outdoor comfort."
      />

      {/* Fan */}
      <AddOnCard
        active={!!addOns.fan}
        onToggle={() => toggleAddOn('fan')}
        title="Outdoor Fan"
        desc="Stay cool with a fan mounted in the center of your pergola. It keeps the air moving so you can enjoy your space, even on hot days, while you relax or entertain."
        note="Requires a structural beam. Compatibility will be verified by our team during quote generation."
      />

      {/* TV */}
      <AddOnCard
        active={!!addOns.tv}
        onToggle={() => toggleAddOn('tv')}
        title="TV"
        desc="Add a TV up to 65 inches to your pergola wall. Great for watching movies or sports outside with friends and family."
        note="Requires a wall for mounting."
      />

      {/* Outlets */}
      <AddOnCard
        active={!!addOns.outlets}
        onToggle={() => toggleAddOn('outlets')}
        title="Outlets"
        desc="Power your outdoor kitchen, music, or lighting with GFCI-protected outlets built for safety. They’re weather-resistant and made to handle rain or shine — perfect for outdoor fun and hosting guests."
        note="Standard installation — no additional structural requirements."
      />

      {/* Heaters */}
      <div className="pb-card p-5 mb-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="pb-display text-xl font-semibold">Heaters</h3>
            <p className="text-sm text-[#5b6368] mt-1 leading-relaxed">
              Stay warm in every season with our stylish and reliable aluminum pergola heaters. Available in a variety of colors, our heaters match any pergola design. Choose the style that fits your space best — wall-mounted, hanging, or freestanding. Pick electric or gas models to suit your heating needs. Perfect for Canada’s changing weather, these heaters help keep your outdoor space cozy all year round.
            </p>
          </div>
          <button
            onClick={() => toggleAddOn('heater')}
            className={`shrink-0 ml-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              addOns.heater
                ? 'bg-[#1a7a4b] text-white border-transparent'
                : 'bg-white text-[#14171a] border-[#d8d8d4] hover:border-[#14171a]'
            }`}
          >
            {addOns.heater && <Check size={14} />}
            {addOns.heater ? 'Selected' : 'Add'}
          </button>
        </div>

        {addOns.heater && (
          <div className="space-y-6 mt-4 border-t border-[#ececea] pt-4">
            {/* Heater Style */}
            <div>
              <p className="text-[10px] pb-mono uppercase tracking-widest text-[#5b6368] mb-2">Heater Style</p>
              <div className="grid grid-cols-3 gap-2">
                {HEATER_TYPES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => updateHeater({ heaterType: t.id, heaterModel: undefined, heaterColor: undefined })}
                    className={`px-3 py-2.5 rounded-lg text-xs font-semibold border transition-colors ${
                      addOns.heaterType === t.id
                        ? 'bg-[#14171a] text-white border-transparent'
                        : 'bg-white text-[#14171a] border-[#d8d8d4] hover:border-[#14171a]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {addOns.heaterType === 'hanging' && (
                <p className="text-xs text-amber-600 mt-2">
                  May require a ceiling beam. Compatibility will be verified by our team during quote generation.
                </p>
              )}
            </div>

            {/* Models for selected type */}
            {addOns.heaterType && (
              <div>
                <p className="text-[11px] font-semibold text-[#14171a] mb-3 capitalize">
                  {addOns.heaterType === 'wall-mounted' ? 'Wall-Mounted Heaters'
                    : addOns.heaterType === 'hanging' ? 'Hanging Heaters'
                    : 'Free Standing Heaters'}
                </p>
                <div className={`grid gap-3 ${
                  addOns.heaterType === 'hanging' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
                }`}>
                  {HEATER_MODELS.filter((m) => m.types.includes(addOns.heaterType)).map((m) => {
                    const active = addOns.heaterModel === m.id;
                    return (
                      <div
                        key={m.id}
                        role="button"
                        tabIndex={0}
                        data-testid={`heater-model-${m.id}`}
                        onClick={() => updateHeater({ heaterModel: m.id })}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); updateHeater({ heaterModel: m.id }); } }}
                        className={`text-center rounded-lg border transition-colors cursor-pointer ${
                          active ? 'border-[#1a7a4b] bg-[#f3f9f5]' : 'border-[#d8d8d4] bg-white hover:border-[#14171a]'
                        }`}
                      >
                        <img
                          src={m.img}
                          alt={m.label}
                          className="w-full h-48 object-contain rounded-t-lg bg-white"
                          loading="lazy"
                        />
                        <div className="p-3">
                          <p className="text-sm font-semibold">{m.label}</p>
                          <p className="text-xs text-[#5b6368]">{m.fuel}</p>
                          <p className="text-xs text-[#5b6368] whitespace-pre-line mt-0.5">{m.spec}</p>
                          {active && <Check size={16} className="text-[#1a7a4b] mx-auto mt-1" />}
                        </div>
                        {/* Color swatches */}
                        {active && m.needsColor && (
                          <div className="flex items-center justify-center gap-3 pb-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); updateHeater({ heaterColor: 'white' }); }}
                              className={`w-8 h-8 rounded-md border-2 ${
                                addOns.heaterColor === 'white' ? 'border-[#1a7a4b] ring-2 ring-[#1a7a4b]/30' : 'border-[#d8d8d4]'
                              } bg-white`}
                              title="White"
                              aria-label="White"
                            />
                            <button
                              onClick={(e) => { e.stopPropagation(); updateHeater({ heaterColor: 'black' }); }}
                              className={`w-8 h-8 rounded-md border-2 ${
                                addOns.heaterColor === 'black' ? 'border-[#1a7a4b] ring-2 ring-[#1a7a4b]/30' : 'border-[#d8d8d4]'
                              } bg-black`}
                              title="Black"
                              aria-label="Black"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}

function AddOnCard({ active, onToggle, title, desc, note }) {
  return (
    <div className={`pb-card p-5 mb-4 ${active ? 'border-[#1a7a4b]' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="pb-display text-xl font-semibold">{title}</h3>
          <p className="text-sm text-[#5b6368] mt-1 leading-relaxed">{desc}</p>
          {note && (
            <p className="text-xs text-amber-600 mt-2 italic">{note}</p>
          )}
        </div>
        <button
          onClick={onToggle}
          className={`shrink-0 ml-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            active
              ? 'bg-[#1a7a4b] text-white border-transparent'
              : 'bg-white text-[#14171a] border-[#d8d8d4] hover:border-[#14171a]'
          }`}
        >
          {active && <Check size={14} />}
          {active ? 'Selected' : 'Add'}
        </button>
      </div>
    </div>
  );
}
