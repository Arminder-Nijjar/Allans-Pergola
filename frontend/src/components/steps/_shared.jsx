import React from 'react';

export function StepHeader({ stepNum, total, title, subtitle }) {
  return (
    <div className="mb-6">
      <p className="pb-mono text-[11px] tracking-[0.22em] uppercase text-[#1a7a4b]">
        Step {String(stepNum).padStart(2, '0')} · of {String(total).padStart(2, '0')}
      </p>
      <h2 className="pb-display text-3xl md:text-4xl font-semibold text-[#14171a] mt-1 leading-[1.1]">
        {title}
      </h2>
      {subtitle && <p className="text-[#5b6368] text-sm mt-2 max-w-md">{subtitle}</p>}
    </div>
  );
}

export function ColorSwatchRow({ colors, value, onChange, testIdPrefix }) {
  return (
    <div className="flex flex-wrap gap-5">
      {colors.map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className="flex flex-col items-center gap-2"
          data-testid={`${testIdPrefix}-${c.id}`}
        >
          <span
            className={`pb-swatch ${value === c.id ? 'pb-swatch-active' : ''}`}
            style={c.hex.startsWith('conic') ? { background: c.hex } : { background: c.hex }}
          />
          <span className={`text-[11px] ${value === c.id ? 'text-[#14171a] font-semibold' : 'text-[#5b6368]'}`}>{c.name}</span>
        </button>
      ))}
    </div>
  );
}

export function NumberSlider({ label, unit, value, min, max, step = 1, onChange, testId }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[#14171a] font-medium">{label}</span>
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
            className="w-16 px-2 py-1.5 text-right text-sm pb-mono font-semibold rounded-md border border-[#d8d8d4] bg-white focus:outline-none focus:border-[#14171a]"
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
