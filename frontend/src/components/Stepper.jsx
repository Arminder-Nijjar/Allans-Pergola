import React from 'react';
import { Check } from 'lucide-react';

export default function Stepper({ steps, current, onJump }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-scroll" data-testid="stepper">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <button
            key={s.id}
            onClick={() => onJump && onJump(i)}
            className="flex items-center gap-2 flex-shrink-0"
            data-testid={`step-dot-${s.id}`}
          >
            <span className={`pb-step-dot ${active ? 'pb-step-dot-active' : ''} ${done ? 'pb-step-dot-done' : ''}`}>
              {done ? <Check size={13} /> : i + 1}
            </span>
            <span className={`text-[12px] uppercase tracking-wider whitespace-nowrap ${active ? 'text-[#14171a] font-semibold' : done ? 'text-[#1a7a4b]' : 'text-[#5b6368]'}`}>
              {s.label}
            </span>
            {i < steps.length - 1 && <span className="w-6 h-px bg-[#d8d8d4]" />}
          </button>
        );
      })}
    </div>
  );
}
