import React, { useMemo } from 'react';
import { StepHeader } from './_shared';
import { Check, Plus, X, Zap, Flame } from 'lucide-react';
import { SIDES, LIMITS } from '../../data/catalog';
import { postPlan, isAttachedSide } from '../../utils/pergolaRules';

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
      {addOns.outlets && (
        <OutletPlacement cfg={cfg} setCfg={setCfg} />
      )}

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

            {/* Wall-mounted heater placement */}
            {addOns.heaterType === 'wall-mounted' && addOns.heaterModel && (
              <HeaterPlacement cfg={cfg} setCfg={setCfg} />
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

/* ── Heater placement: choose which section/side gets wall-mounted heaters ── */
function HeaterPlacement({ cfg, setCfg }) {
  const toggleHeater = (sectionId, side, index) => {
    setCfg((c) => {
      const heaters = c.heaters || [];
      const exists = heaters.some((h) => h.sectionId === sectionId && h.side === side && (h.index ?? 0) === index);
      if (exists) {
        return { ...c, heaters: heaters.filter((h) => !(h.sectionId === sectionId && h.side === side && (h.index ?? 0) === index)) };
      }
      return { ...c, heaters: [...heaters, { sectionId, side, index }] };
    });
  };

  const sideLength = (section, sideId) => {
    return (sideId === 'front' || sideId === 'back') ? section.length : section.width;
  };

  return (
    <div className="mt-4 pb-card p-4 md:p-5">
      <p className="text-[10px] pb-mono uppercase tracking-widest text-[#5b6368] mb-3 flex items-center gap-1.5">
        <Flame size={13} />
        Heater Placement
      </p>
      <p className="text-xs text-[#5b6368] mb-3">
        Choose which sides will have wall-mounted heaters.
        Sides over 15 ft can have up to 2 heaters.
      </p>

      <div className="space-y-4">
        {cfg.sections.map((section, idx) => (
          <div key={section.id}>
            {cfg.sections.length > 1 && (
              <p className="text-xs font-semibold text-[#14171a] mb-2">Section {idx + 1}</p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {SIDES.map((s) => {
                const isAttached = isAttachedSide(cfg, section.id, s.id);
                const len = sideLength(section, s.id);
                const maxCount = len > 15 ? 2 : 1;
                const existing = (cfg.heaters || []).filter((h) => h.sectionId === section.id && h.side === s.id);

                if (isAttached) {
                  return (
                    <button
                      key={s.id}
                      disabled
                      className="px-3 py-2 rounded-lg text-xs font-semibold border bg-[#f3f3ef] text-[#a8a8a4] border-[#d8d8d4] cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      {s.label} <span className="text-[10px] opacity-70">(house)</span>
                    </button>
                  );
                }

                return (
                  <div key={s.id} className="flex flex-col gap-1">
                    <span className="text-[10px] text-[#5b6368] text-center">{s.label}</span>
                    <div className="flex gap-1">
                      {[0, 1].map((i) => {
                        if (i >= maxCount) return null;
                        const has = existing.some((h) => (h.index ?? 0) === i);
                        return (
                          <button
                            key={i}
                            onClick={() => toggleHeater(section.id, s.id, i)}
                            className={`flex-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors flex items-center justify-center gap-1 ${
                              has
                                ? 'bg-[#1a7a4b] text-white border-transparent'
                                : 'bg-white text-[#14171a] border-[#d8d8d4] hover:border-[#14171a]'
                            }`}
                            title={`${s.label} heater ${i + 1}${len > 15 ? '' : ' (max 1)'}`}
                          >
                            {has && <Check size={12} />}
                            {i + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {(cfg.heaters || []).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {cfg.heaters.map((h, i) => {
            const secIdx = cfg.sections.findIndex((s) => s.id === h.sectionId) + 1;
            const sideLabel = SIDES.find((s) => s.id === h.side)?.label || h.side;
            const index = h.index ?? 0;
            const section = cfg.sections.find((s) => s.id === h.sectionId);
            const len = section ? sideLength(section, h.side) : 0;
            const showNum = len > 15;
            return (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-[#e6f3eb] text-[#1a7a4b]">
                {cfg.sections.length > 1 ? `S${secIdx}` : ''} {sideLabel}{showNum ? ` #${index + 1}` : ''}
                <button
                  onClick={() => toggleHeater(h.sectionId, h.side, index)}
                  className="hover:text-red-600"
                >
                  <X size={11} />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Outlet placement: choose which posts get outlets ── */
function OutletPlacement({ cfg, setCfg }) {
  const toggleOutlet = (sectionId, postKey, postLabel) => {
    setCfg((c) => {
      const outlets = c.outlets || [];
      const exists = outlets.some((o) => o.sectionId === sectionId && o.postKey === postKey);
      if (exists) {
        return { ...c, outlets: outlets.filter((o) => !(o.sectionId === sectionId && o.postKey === postKey)) };
      }
      return { ...c, outlets: [...outlets, { sectionId, postKey, label: postLabel }] };
    });
  };

  return (
    <div className="pb-card p-4 md:p-5 mb-4">
      <p className="text-[10px] pb-mono uppercase tracking-widest text-[#5b6368] mb-3 flex items-center gap-1.5">
        <Zap size={13} />
        Outlet Placement
      </p>
      <p className="text-xs text-[#5b6368] mb-3">Select posts where GFCI outlets will be installed (~2 ft above ground).</p>

      <div className="space-y-4">
        {cfg.sections.map((section, idx) => {
          const plan = postPlan(cfg, section.id);
          const posts = [];

          // Corner posts
          const cornerLabels = { bl: 'Back-Left', br: 'Back-Right', fr: 'Front-Right', fl: 'Front-Left' };
          plan.cornerList?.forEach((c) => {
            posts.push({
              key: c.key,
              label: `Corner — ${cornerLabels[c.id]}`,
            });
          });

          // Extra posts
          plan.extraPosts.forEach((p) => {
            const sideLabel = { front: 'Front', back: 'Back', left: 'Left', right: 'Right' }[p.side];
            posts.push({
              key: p.positionKey,
              label: `${p.isMandatory ? 'Support' : 'Accessory'} — ${sideLabel} (${p.position.toFixed(1)} ft)`,
            });
          });

          if (posts.length === 0) return null;

          return (
            <div key={section.id}>
              {cfg.sections.length > 1 && (
                <p className="text-xs font-semibold text-[#14171a] mb-2">Section {idx + 1}</p>
              )}
              <div className="space-y-1.5">
                {posts.map((post) => {
                  const hasOutlet = (cfg.outlets || []).some((o) => o.sectionId === section.id && o.postKey === post.key);
                  return (
                    <button
                      key={post.key}
                      onClick={() => toggleOutlet(section.id, post.key, post.label)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                        hasOutlet
                          ? 'bg-[#fff8e6] text-[#c98a2a] border-[#f0e0b0]'
                          : 'bg-white text-[#14171a] border-[#d8d8d4] hover:border-[#1a7a4b]'
                      }`}
                    >
                      <span>{post.label}</span>
                      {hasOutlet ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold">
                          <Zap size={13} /> Outlet
                        </span>
                      ) : (
                        <Plus size={13} className="text-[#5b6368]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
