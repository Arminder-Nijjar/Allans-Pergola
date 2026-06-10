import React from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Stepper({ steps, current, maxVisited, onJump }) {
  const canJump = (i) => i <= maxVisited || i === current;
  const canGoPrev = current > 0;
  const canGoNext = current < steps.length - 1;

  return (
    <div className="flex items-center gap-3" data-testid="stepper" role="tablist" aria-label="Pergola builder steps">
      {/* Previous button */}
      <button
        onClick={() => canGoPrev && onJump && onJump(current - 1)}
        disabled={!canGoPrev}
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-200 ${
          canGoPrev
            ? 'border-[#d8d8d4] bg-white text-[#14171a] hover:border-[#1a7a4b] hover:bg-[#1a7a4b] hover:text-white hover:shadow-md cursor-pointer'
            : 'border-[#ececea] bg-[#f5f5f2] text-[#c4c4c0] cursor-not-allowed'
        }`}
        aria-label="Previous step"
        title="Previous step"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Steps scroll area */}
      <div className="flex items-center gap-2 overflow-x-auto pb-scroll flex-1">
        {steps.map((s, i) => {
          const done = i < current;
          const active = i === current;
          const clickable = canJump(i);

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
              className={`flex items-center gap-2 flex-shrink-0 group transition-opacity ${
                clickable ? 'cursor-pointer' : 'cursor-default opacity-60'
              }`}
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
                    ? 'group-hover:ring-2 group-hover:ring-[#1a7a4b]/30 group-hover:scale-110'
                    : ''
                }`}
              >
                {done ? <Check size={13} /> : i + 1}
              </span>
              <span
                className={`text-[12px] uppercase tracking-wider whitespace-nowrap transition-colors ${
                  active
                    ? 'text-[#14171a] font-semibold'
                    : done
                    ? 'text-[#1a7a4b]'
                    : 'text-[#5b6368]'
                } ${clickable ? 'group-hover:text-[#1a7a4b] group-hover:underline underline-offset-2' : ''}`}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <span
                  className={`w-6 h-px transition-colors ${
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
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-200 ${
          canGoNext
            ? 'border-[#d8d8d4] bg-white text-[#14171a] hover:border-[#1a7a4b] hover:bg-[#1a7a4b] hover:text-white hover:shadow-md cursor-pointer'
            : 'border-[#ececea] bg-[#f5f5f2] text-[#c4c4c0] cursor-not-allowed'
        }`}
        aria-label="Next step"
        title="Next step"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
