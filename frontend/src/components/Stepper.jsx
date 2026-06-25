import React from 'react';
import { Check, ChevronLeft, ChevronRight, Home, ArrowRightLeft } from 'lucide-react';

export default function Stepper({ steps, current, onJump, compareState, onSwitchConfig, onStartCompare }) {
  const canGoPrev = current > 0;
  const canGoNext = current < steps.length - 1;

  const isCompareMode = compareState?.isComparing && compareState?.firstConfig;
  const activeConfigTab = compareState?.activeConfigTab || 'A';

  return (
    <div className="flex flex-col gap-2" data-testid="stepper" role="tablist" aria-label="Pergola builder steps">
      {/* Config Tabs Row - shown in compare mode */}
      {isCompareMode ? (
        <div className="flex flex-col gap-2 pb-3 border-b border-[#ececea]">
          {/* Editing indicator */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#5b6368]">Currently editing:</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${activeConfigTab === 'A' ? 'bg-[#1a7a4b] text-white' : activeConfigTab === 'B' ? 'bg-[#bbf7d0] text-[#14532d]' : 'bg-[#f5f5f3] text-[#5b6368]'}`}>
              Pergola {activeConfigTab}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Pergola A Tab */}
            <button
              onClick={() => onSwitchConfig && onSwitchConfig('A')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all ${
                activeConfigTab === 'A'
                  ? 'bg-[#1a7a4b] text-white shadow-md ring-2 ring-[#1a7a4b]/30'
                  : 'bg-[#f5f5f3] text-[#5b6368] hover:bg-[#e8e8e6]'
              }`}
            >
              <Home size={16} />
              <span className="font-semibold">A</span>
              {compareState?.firstConfig && (
                <span className="opacity-80 font-medium">
                  {compareState.firstConfig.sections.map(s => `${s.length}×${s.width}`).join(' + ')}
                </span>
              )}
              {compareState?.firstConfig && (
                <Check size={14} className="text-[#4ade80]" />
              )}
            </button>

            {/* Pergola B Tab */}
            <button
              onClick={() => onSwitchConfig && onSwitchConfig('B')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all ${
                activeConfigTab === 'B'
                  ? 'bg-[#bbf7d0] text-[#14532d] shadow-md ring-2 ring-[#86efac]'
                  : 'bg-[#f5f5f3] text-[#5b6368] hover:bg-[#e8e8e6]'
              }`}
            >
              <Home size={16} />
              <span className="font-semibold">B</span>
              {compareState?.secondConfig && (
                <span className="opacity-80 font-medium">
                  {compareState.secondConfig.sections.map(s => `${s.length}×${s.width}`).join(' + ')}
                </span>
              )}
              {compareState?.secondConfig && (
                <Check size={14} className="text-[#4ade80]" />
              )}
            </button>

            {/* Compare button */}
            <button
              onClick={() => onSwitchConfig && onSwitchConfig('compare')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all bg-[#14171a] text-white hover:bg-[#2d3339] shadow-md"
            >
              <ArrowRightLeft size={16} />
              <span className="font-semibold hidden sm:inline">Compare</span>
            </button>
          </div>
        </div>
      ) : (
        /* Normal mode - show Compare button to start comparison */
        <div className="flex items-center justify-between pb-2 border-b border-[#eaeae6]">
          <span className="text-sm text-[#8a8f94]">Build your pergola, then compare designs</span>
          <button
            onClick={() => onStartCompare && onStartCompare()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all bg-[#1a7a4b] text-white hover:bg-[#145c3a] shadow-md"
          >
            <ArrowRightLeft size={16} />
            <span className="font-semibold">Compare</span>
          </button>
        </div>
      )}

      {/* Steps Row - always visible, horizontally scrollable */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 stepper-scroll">
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
      <div className="flex items-center gap-1 flex-1 stepper-scroll">
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
              className={`flex items-center gap-2 flex-shrink-0 group rounded-lg px-3 py-2 transition-all duration-200 ${
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
                className={`text-[13px] whitespace-nowrap transition-colors ${
                  active
                    ? 'text-[#14171a] font-semibold'
                    : done
                    ? 'text-[#1a7a4b] font-medium'
                    : 'text-[#8a8f94]'
                } ${clickable && !active ? 'group-hover:text-[#1a7a4b] group-hover:font-medium' : ''}`}
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
                    done ? 'bg-[#1a7a4b]/40' : 'bg-[#e0e0dc]'
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
    </div>
  );
}
