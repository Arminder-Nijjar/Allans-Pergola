import React, { useEffect } from 'react';
import { StepHeader } from './_shared';
import { WALL_COLORS, SIDES, LIMITS } from '../../data/catalog';
import { segmentsForSide, segmentsForSide as segmentsForSideUtil, isAttachedSide } from '../../utils/pergolaRules';
import { getLShapeAvailableSides, canPlaceWallOnLShapeSegment, getWallPlacementTooltip, getModules } from '../../utils/pergolaLayout';
import { Trash2, MousePointerClick, Check, Info } from 'lucide-react';

export default function WallsStep({ cfg, setCfg, stepNum, total }) {
  // Debug: log walls
  console.log('[WallsStep] walls:', cfg.walls.map(w => `${w.sectionId}.${w.side}`).join(', '));
  
  useEffect(() => {
    setCfg((c) => ({ ...c, editMode: 'wall' }));
    return () => setCfg((c) => ({ ...c, editMode: 'none' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeAt = (i) => setCfg((c) => ({ ...c, walls: c.walls.filter((_, idx) => idx !== i) }));

  const addOnSide = (sectionId, side, segmentIdx) => {
    // Skip if this is the attached side (house wall) - can't add walls on house wall
    if (isAttachedSide(cfg, sectionId, side)) return;

    // For L-shape, use local segment index directly (sectionId and side already known)
    if (cfg.layout === 'l-shape') {
      const modules = getModules(cfg);

      // Check if can place wall (entry opening rule) - use local segment index
      const canPlace = canPlaceWallOnLShapeSegment(cfg, modules, segmentIdx);
      if (!canPlace) return; // Can't place - would block all entry

      setCfg((c) => {
        // Check if already has wall on this specific section/side/segment
        const hasWall = c.walls?.some(w => w.sectionId === sectionId && w.side === side && w.segIdx === segmentIdx);
        if (hasWall) {
          // Remove wall
          return { ...c, walls: c.walls.filter(w => !(w.sectionId === sectionId && w.side === side && w.segIdx === segmentIdx)) };
        }

        // Check if has screen - if so, remove it
        const hasScreen = c.screens?.some(s => s.sectionId === sectionId && s.side === side && s.segIdx === segmentIdx);
        const newScreens = hasScreen ? c.screens.filter(s => !(s.sectionId === sectionId && s.side === side && s.segIdx === segmentIdx)) : c.screens;

        // Add wall on this segment using local segment index
        return {
          ...c,
          walls: [...c.walls, { sectionId, side, segIdx: segmentIdx, color: c.wallColor, gap: c.wallGap }],
          screens: newScreens
        };
      });
      return;
    }
    
    // Horizontal layout - add to specific segment
    setCfg((c) => {
      const segs = segmentsForSide(c, sectionId, side);
      const targetSeg = segs.find((s) => s.idx === segmentIdx);
      if (!targetSeg) return c;

      // Check if already has wall on this segment
      const existing = c.walls.find((w) => w.sectionId === sectionId && w.side === side && w.segIdx === segmentIdx);
      if (existing) {
        // Remove wall
        return {
          ...c,
          walls: c.walls.filter((w) => !(w.sectionId === sectionId && w.side === side && w.segIdx === segmentIdx)),
        };
      }

      // ENFORCE: At least one exterior side must be open (no walls) for entry
      const newWalls = [...c.walls, { sectionId, side, segIdx: segmentIdx, color: c.wallColor, gap: c.wallGap }];
      
      // Check if this would block all entry points
      if (!hasEntryOpening(c, newWalls)) {
        return c; // Would block all entry points, reject
      }

      // Remove any screen on this segment
      const newScreens = c.screens.filter((s) => !(s.sectionId === sectionId && s.side === side && s.segIdx === segmentIdx));
      
      return {
        ...c,
        walls: newWalls,
        screens: newScreens,
      };
    });
  };
  
  // Helper: Check if at least 1 exterior side has at least 1 free segment
  // If yes, you can wall off all other sides completely
  const hasEntryOpening = (config, walls) => {
    // Get all exterior sides across all sections
    const allExteriorSides = [];
    for (const section of config.sections) {
      ['front', 'back', 'left', 'right'].forEach(side => {
        // Skip attached side (house wall) - not a valid entry
        if (config.style === 'attached' && config.attachedSide === side) return;
        allExteriorSides.push({ sectionId: section.id, side });
      });
    }
    
    // Check if at least 1 side has fewer walls than its segments (at least 1 free)
    for (const { sectionId, side } of allExteriorSides) {
      const section = config.sections.find(s => s.id === sectionId);
      const isLongSide = side === 'front' || side === 'back';
      const sideLength = isLongSide ? section.length : section.width;
      // 2 segments if side > 15ft (needs extra post), else 1 segment
      const totalSegments = sideLength > 15 ? 2 : 1;
      
      const wallsOnSide = walls.filter(w => w.sectionId === sectionId && w.side === side).length;
      // Side has entry opening if walls < total segments
      if (wallsOnSide < totalSegments) {
        return true; // At least 1 side has a free segment
      }
    }
    
    // All sides are fully walled - no free segments anywhere
    return false;
  };

  const updateGap = (val) => setCfg((c) => ({ ...c, wallGap: val }));

  const isKit = cfg.layout === '10x12-kit';

  return (
    <div className="pb-fadeup">
      <StepHeader
        stepNum={stepNum}
        total={total}
        title="Add walls"
        subtitle={cfg.layout === 'l-shape'
          ? "Solid or slatted aluminum walls on outer perimeter. At least 1 side must remain open for entry."
          : "Solid or slatted aluminum walls between posts. At least 1 exterior side must remain open for entry."}
      />

      {isKit && (
        <div className="pb-card p-5 bg-[#f3f9f5] border-[#cce4d7] mb-6">
          <p className="text-sm font-semibold text-[#14171a] mb-3">Standard Kit Wall Specs</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-[#5b6368]">Colour:</span> <strong>White</strong></div>
            <div><span className="text-[#5b6368]">Style:</span> <strong>Solid</strong></div>
          </div>
          <p className="text-xs text-[#5b6368] mt-3">Wall finish is fixed for the Standard Kit. You can still place walls on sides.</p>
        </div>
      )}

      <div className="pb-clickhint mb-5 flex gap-2 items-start" data-testid="wall-clickhint">
        <MousePointerClick size={16} className="mt-0.5 flex-shrink-0" />
        <span>
          {isKit
            ? <>Click a side in the <strong>3D preview</strong> to place a wall.</>
            : <>Pick a finish &amp; gap below, then click a side in the <strong>3D preview</strong> to place it.</>}
        </span>
      </div>

      {!isKit && (
        <>
          <p className="text-[10px] pb-mono uppercase tracking-widest text-[#5b6368] mb-3">Wall color</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            {WALL_COLORS.map((c) => {
              const active = cfg.wallColor === c.id;
              return (
                <button
                  key={c.id}
                  data-testid={`wall-color-${c.id}`}
                  onClick={() => setCfg((cf) => ({ ...cf, wallColor: c.id }))}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-full border text-sm font-medium ${
                    active ? 'border-[#14171a] bg-[#14171a] text-white' : 'border-[#d8d8d4] bg-white hover:border-[#14171a]'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full border border-black/10" style={{ background: c.hex }} />
                  <span>{c.name}</span>
                  {active && <Check size={13} />}
                </button>
              );
            })}
          </div>

          <p className="text-[10px] pb-mono uppercase tracking-widest text-[#5b6368] mb-3">Wall style</p>
          <div className="grid grid-cols-2 gap-3 mb-7">
            <WallStyleCard
              active={cfg.wallGap === 0}
              onClick={() => updateGap(0)}
              title="Solid"
              desc="No gaps — complete privacy"
              testId="wall-style-solid"
            />
            <WallStyleCard
              active={cfg.wallGap > 0}
              onClick={() => updateGap(LIMITS.wallGap.min)}
              title="Slatted"
              desc="Horizontal slats with adjustable gaps"
              testId="wall-style-slatted"
            />
          </div>

          {cfg.wallGap > 0 && (
            <div className="pb-card p-4 mb-6">
              <label htmlFor="wall-gap-slider" className="block text-sm font-semibold mb-2">
                Gap between slats: <span className="text-[#1a7a4b]">{cfg.wallGap} inches</span>
              </label>
              <input
                id="wall-gap-slider"
                data-testid="wall-gap-slider"
                type="range"
                min={LIMITS.wallGap.min}
                max={LIMITS.wallGap.max}
                step={LIMITS.wallGap.step}
                value={cfg.wallGap}
                onChange={(e) => updateGap(parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-[#5b6368] mt-2">
                Gaps range from {LIMITS.wallGap.min}" (minimal airflow) to {LIMITS.wallGap.max}" (open slat design).
              </p>
            </div>
          )}
        </>
      )}

      {cfg.sections.map((section, sectionIdx) => {
        const sectionWalls = cfg.walls.filter((w) => w.sectionId === section.id);

        return (
          <div key={section.id} className="mb-6">
            {cfg.layout === 'l-shape' && (
              <h3 className="text-sm font-semibold text-[#14171a] mb-3 pb-display">
                Section {sectionIdx + 1}
              </h3>
            )}

            <p className="text-[10px] pb-mono uppercase tracking-widest text-[#5b6368] mb-3">Quick add wall to a segment</p>
            <div className="space-y-3">
              {SIDES.map((s) => {
                // Check if this is the attached side
                const isAttached = isAttachedSide(cfg, section.id, s.id);

                const segs = segmentsForSide(cfg, section.id, s.id);
                const hasMultipleSegments = segs.length > 1;

                return (
                  <div key={s.id} className="border border-[#ececea] rounded-lg p-3">
                    <p className="text-xs font-semibold text-[#14171a] mb-2">
                      {s.label} Side
                      {isAttached && <span className="ml-2 text-xs text-[#c9bba0]">(House Wall)</span>}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {isAttached ? (
                        // Attached side - show as already having house wall
                        <button
                          disabled
                          className="w-full px-3 py-2 rounded-full text-sm font-semibold border bg-[#c9bba0] text-white border-[#c9bba0] cursor-not-allowed"
                        >
                          ✓ House Wall (Attached)
                        </button>
                      ) : (
                        segs.map((seg) => {
                          const hasWall = sectionWalls.some((w) => w.sectionId === section.id && w.side === s.id && w.segIdx === seg.idx);
                          
                          // Check if adding wall here would block entry
                          const testWalls = hasWall ? sectionWalls.filter((w) => !(w.sectionId === section.id && w.side === s.id && w.segIdx === seg.idx)) : [...sectionWalls, { sectionId: section.id, side: s.id, segIdx: seg.idx }];
                          const allWalls = [...cfg.walls.filter((w) => w.sectionId !== section.id), ...testWalls];
                          const wouldBlockEntry = !hasEntryOpening({ ...cfg, walls: allWalls }, allWalls);
                          const disabled = !hasWall && wouldBlockEntry;
                          
                          const segLabel = hasMultipleSegments ? `Segment ${seg.idx + 1} (${seg.length.toFixed(1)} ft)` : 'Add Wall';
                          return (
                            <div key={seg.idx} className="relative group">
                              <button
                                data-testid={`wall-segment-${section.id}-${s.id}-${seg.idx}`}
                                disabled={disabled}
                                onClick={() => addOnSide(section.id, s.id, seg.idx)}
                                className={`w-full px-3 py-2 rounded-full text-sm font-semibold border ${
                                  hasWall
                                    ? 'bg-[#c0392b] text-white border-[#c0392b]'
                                    : disabled
                                      ? 'bg-[#f3f3ef] text-[#a8a8a4] border-[#d8d8d4] cursor-not-allowed'
                                      : 'bg-white text-[#14171a] border-[#d8d8d4] hover:border-[#14171a]'
                                }`}
                              >
                                {hasWall ? '✓ ' : disabled ? '✕ ' : '+ '}{segLabel}
                              </button>
                              {disabled && (
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-[#14171a] text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                  <Info size={12} className="inline mr-1" />
                                  Need at least 1 segment open for entry
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-[#14171a]"></div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {cfg.walls.length > 0 && (
        <div className="mt-7">
          <p className="text-[10px] pb-mono uppercase tracking-widest text-[#5b6368] mb-2">
            Placed walls ({cfg.walls.length})
          </p>
          <ul className="divide-y divide-[#ececea] pb-card overflow-hidden" data-testid="wall-list">
            {cfg.walls.map((w, i) => {
              const wallColor = WALL_COLORS.find((c) => c.id === w.color);
              const sectionNum = cfg.sections.findIndex((sec) => sec.id === w.sectionId) + 1;
              // Check if this is an attached wall (house wall)
              const isAttachedWall = cfg.style === 'attached' && cfg.attachedSide === w.side;
              return (
                <li key={`${w.sectionId}-${w.side}-${w.segIdx}`} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    {cfg.layout === 'l-shape' && <span className="text-[#5b6368] text-xs">S{sectionNum}</span>}
                    <span className="w-3 h-3 rounded-full border border-black/10" style={{ background: wallColor?.hex }} />
                    <span className="text-sm">
                      <span className="pb-num-chip mr-2">{w.side}</span>
                      segment {w.segIdx + 1} ·{' '}
                      <span className="text-[#5b6368]">{w.gap === 0 ? 'solid' : `${w.gap}" gap`}</span>
                      {isAttachedWall && (
                        <span className="ml-2 text-xs text-[#c9bba0] font-medium">(House Wall)</span>
                      )}
                    </span>
                  </div>
                  {!isAttachedWall && (
                    <button
                      onClick={() => removeAt(i)}
                      className="text-[#5b6368] hover:text-[#c0392b] flex items-center gap-1 text-xs"
                      data-testid={`wall-remove-${i}`}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function WallStyleCard({ active, onClick, title, desc, testId }) {
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      className={`pb-tile ${active ? 'pb-tile-active' : ''} text-left`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="pb-display font-semibold">{title}</span>
        {active && <Check size={16} className="text-[#1a7a4b]" />}
      </div>
      <p className="text-xs text-[#5b6368] leading-relaxed">{desc}</p>
    </button>
  );
}
