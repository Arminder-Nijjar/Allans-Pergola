import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { postPlan } from '../../utils/pergolaRules';

const LIMITS = { minCornerOffset: 4, minPostSpacing: 4 };

export function PostSlider({ side, section, cfg, onPositionChange, isMandatory = true, onRemove, positionKey }) {
  const [isDragging, setIsDragging] = useState(false);

  const sideLabel = { front: 'Front', back: 'Back', left: 'Left', right: 'Right' }[side];
  const isHoriz = side === 'front' || side === 'back';
  const sideLength = isHoriz ? section.length : section.width;

  // Compute valid position range based on neighboring posts on this side
  const { minBound, maxBound } = useMemo(() => {
    const plan = postPlan(cfg, section.id);
    const allPostsOnSide = plan.extraPosts.filter((p) => p.side === side);
    const sortedPosts = [...allPostsOnSide].sort((a, b) => a.position - b.position);
    const myIndex = sortedPosts.findIndex((p) => p.positionKey === positionKey);

    let minB = LIMITS.minCornerOffset;
    let maxB = sideLength - LIMITS.minCornerOffset;

    if (myIndex > 0) {
      minB = sortedPosts[myIndex - 1].position + LIMITS.minPostSpacing;
    }
    if (myIndex >= 0 && myIndex < sortedPosts.length - 1) {
      maxB = sortedPosts[myIndex + 1].position - LIMITS.minPostSpacing;
    }

    return { minBound: Math.min(minB, maxB), maxBound: Math.max(minB, maxB) };
  }, [cfg, section.id, side, positionKey, sideLength]);

  const minPos = minBound;
  const maxPos = maxBound;

  // Get current position from config
  const currentPos = cfg.extraPostPositions?.[positionKey] ?? (sideLength / 2);

  // Ensure currentPos is within bounds
  const boundedPos = Math.max(minPos, Math.min(maxPos, currentPos));
  const pct = maxPos > minPos ? ((boundedPos - minPos) / (maxPos - minPos)) * 100 : 50;

  const handlePositionChange = (newValue) => {
    const clamped = Math.max(minPos, Math.min(maxPos, parseFloat(newValue)));
    onPositionChange(clamped);
  };

  return (
    <div className="py-3 rounded-lg border-b border-[#e5e5e0] last:border-0">
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-sm font-semibold text-[#14171a]">
            {sideLabel} {isMandatory ? 'Support Post' : 'Accessory Post'}
            {!isMandatory && (
              <span className="ml-2 text-[10px] font-normal text-[#5b6368]">(accessory)</span>
            )}
          </span>
          <p className="text-[11px] text-[#5b6368] mt-0.5">
            Section {section.id === 'section-1' ? '1' : '2'} • {sideLabel} side ({boundedPos.toFixed(1)} ft from corner)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={minPos}
            max={maxPos}
            step={0.5}
            value={Math.round(boundedPos * 10) / 10}
            onChange={(e) => handlePositionChange(e.target.value)}
            className="w-16 px-2 py-1.5 text-right text-sm pb-mono font-semibold rounded-md border border-[#d8d8d4] bg-white focus:outline-none focus:border-[#1a7a4b]"
            placeholder={`${minPos}-${maxPos}`}
          />
          <span className="text-xs text-[#5b6368]">ft</span>
          {onRemove && (
            <button
              onClick={onRemove}
              className="ml-1 p-1.5 rounded-md text-[#5b6368] hover:text-red-600 hover:bg-red-50 transition-colors"
              title={isMandatory ? 'Remove support post' : 'Remove accessory post'}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
      <input
        type="range"
        min={minPos}
        max={maxPos}
        step={0.5}
        value={boundedPos}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onTouchStart={() => setIsDragging(true)}
        onTouchEnd={() => setIsDragging(false)}
        onChange={(e) => handlePositionChange(e.target.value)}
        className="pb-range w-full cursor-pointer"
        style={{ '--pb-pct': `${pct}%` }}
      />
      <div className="flex justify-between mt-1">
        <span className="text-[10px] pb-mono text-[#5b6368]">{minPos.toFixed(1)} ft</span>
        <span className="text-[10px] pb-mono text-[#5b6368]">{maxPos.toFixed(1)} ft</span>
      </div>
    </div>
  );
}
