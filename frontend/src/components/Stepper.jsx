import React from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Stepper({ steps, current, onJump }) {
  const canGoPrev = current > 0;
  const canGoNext = current < steps.length - 1;

  return (
    <div className="flex items-center gap-3" data-testid="stepper" role="tablist" aria-label="Pergola builder steps">
      {/* Previous button */}
      <button
        onClick={() => canGoPrev && onJump && onJump(current - 1)}
        disabled={!canGoPrev}
        className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-200 ${
          canGoPrev
            ? 'border-[#d8d8d4] bg-white text-[#14171a] hover:border-[#1a7a4b] hover:bg-[#1a7a4b] hover:text-white hover:shadow-md cursor-pointer'
            : 'border-[#ececea] bg-[#f5f5f2] text-[#c4c4c0] cursor-not-allowed'
        }`}
        aria-label="Previous step"
        title="Previous step"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Steps */}
      <div className="flex items-center gap-1 flex-1 justify-between overflow-hidden">
        {steps.map((s, i) => {
          const done = i < current;
          const active = i === current;
          const clickable = true;

          return (
            <button
              key={s.id}
              onClick={() => clickable && onJump && onJump(i)}
              onKeyDown={(e) => {
                if (clickable && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onJump && onJump(i);
                }
              }}
              className={`flex items-center gap-2 flex-shrink-0 group rounded-lg px-2 py-1.5 -mx-2 -my-1.5 transition-all duration-200 ${
                clickable
                  ? 'cursor-pointer hover:bg-[#f0f7f3]'
                  : 'cursor-default opacity-50'
              } ${active ? 'bg-[#f0f7f3]' : ''}`}
              data-testid={`step-dot-${s.id}`}
              role="tab"
              aria-selected={active}
              aria-disabled={!clickable}
              tabIndex={clickable ? 0 : -1}
              title={clickable ? `Go to ${s.label}` : s.label}
            >
              <span
                className={`pb-step-dot transition-all duration-200 ${
                  active ? 'pb-step-dot-active' : ''
                } ${done ? 'pb-step-dot-done' : ''} ${
                  clickable && !active
                    ? 'group-hover:ring-[3px] group-hover:ring-[#1a7a4b]/40 group-hover:scale-110 group-hover:shadow-sm'
                    : ''
                }`}
              >
                {done ? <Check size={13} /> : i + 1}
              </span>
              <span
                className={`text-[13px] uppercase tracking-wider whitespace-nowrap transition-colors ${
                  active
                    ? 'text-[#14171a] font-semibold'
                    : done
                    ? 'text-[#1a7a4b]'
                    : 'text-[#5b6368]'
                } ${clickable && !active ? 'group-hover:text-[#1a7a4b] group-hover:font-semibold' : ''}`}
              >
                {s.label}
              </span>
              {clickable && !active && (
                <span className="w-0 overflow-hidden group-hover:w-4 group-hover:ml-0.5 transition-all duration-200">
                  <ChevronRight size={14} className="text-[#1a7a4b] flex-shrink-0" />
                </span>
              )}
              {i < steps.length - 1 && (
                <span
                  className={`w-8 h-px transition-colors ${
                    done ? 'bg-[#1a7a4b]' : 'bg-[#d8d8d4]'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Next button */}
      <button
        onClick={() => canGoNext && onJump && onJump(current + 1)}
        disabled={!canGoNext}
        className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-200 ${
          canGoNext
            ? 'border-[#d8d8d4] bg-white text-[#14171a] hover:border-[#1a7a4b] hover:bg-[#1a7a4b] hover:text-white hover:shadow-md cursor-pointer'
            : 'border-[#ececea] bg-[#f5f5f2] text-[#c4c4c0] cursor-not-allowed'
        }`}
        aria-label="Next step"
        title="Next step"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
