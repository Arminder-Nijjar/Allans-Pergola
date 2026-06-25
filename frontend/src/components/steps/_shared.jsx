import React from 'react';
import { Check } from 'lucide-react';

export function StepHeader({ stepNum, total, title, subtitle }) {
  return (
    <div className="mb-8 pb-2">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e7f1ea] text-[#1a7a4b] text-[10px] font-bold pb-mono uppercase tracking-wider mb-3">
        Step {String(stepNum).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>
      <h2 className="pb-display text-[28px] md:text-[34px] font-semibold text-[#14171a] leading-[1.15] tracking-[-0.01em]">
        {title}
      </h2>
      {subtitle && <p className="text-[#5b6368] text-[15px] mt-2 max-w-md leading-relaxed">{subtitle}</p>}
    </div>
  );
}

export function ColorSwatchRow({ colors, value, onChange, testIdPrefix }) {
  return (
    <div className="flex flex-wrap gap-6">
      {colors.map((c) => {
        const active = value === c.id;
        return (
          <button
            key={c.id}
            onClick={() => onChange(c.id)}
            className="flex flex-col items-center gap-2"
            data-testid={`${testIdPrefix}-${c.id}`}
          >
            <span
              className={`pb-swatch ${active ? 'pb-swatch-active' : ''}`}
              style={c.hex.startsWith('conic') ? { background: c.hex } : { background: c.hex }}
            >
              {active && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Check size={20} strokeWidth={3} className="text-white drop-shadow-md" />
                </span>
              )}
            </span>
            <span className={`text-xs ${active ? 'text-[#14171a] font-bold' : 'text-[#5b6368]'}`}>{c.name}</span>
          </button>
        );
      })}
    </div>
  );
}

export function NumberSlider({ label, unit, value, min, max, step = 1, onChange, testId }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-[#14171a] font-semibold">{label}</span>
        <div className="flex items-center gap-2 bg-[#f3f3ef] rounded-lg px-3 py-1.5">
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
            className="w-16 px-1 py-0.5 text-right text-base pb-mono font-bold rounded border-0 bg-transparent focus:outline-none focus:ring-0"
          />
          <span className="text-sm text-[#5b6368] font-medium">{unit}</span>
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
      <div className="flex justify-between mt-2">
        <span className="text-[11px] pb-mono text-[#5b6368] font-medium">{min} {unit}</span>
        <span className="text-[11px] pb-mono text-[#5b6368] font-medium">{max} {unit}</span>
      </div>
    </div>
  );
}
