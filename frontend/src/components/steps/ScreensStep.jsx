import React, { useEffect } from 'react';
import { StepHeader, ColorSwatchRow } from './_shared';
import { SCREEN_COLORS, SIDES } from '../../data/catalog';
import { screenOperation, segmentsForSide } from '../../utils/pergolaRules';
import { isSideFullyInterior, getLShapeAvailableSides, canPlaceScreenOnLShapeSegment, getScreenPlacementTooltip, getModules, isSideAvailableForLShape } from '../../utils/pergolaLayout';
import { Trash2, MousePointerClick } from 'lucide-react';

export default function ScreensStep({ cfg, setCfg, stepNum, total }) {
  // Auto-enable screen edit mode on entering this step
  useEffect(() => {
    setCfg((c) => ({ ...c, editMode: 'screen' }));
    return () => setCfg((c) => ({ ...c, editMode: 'none' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeAt = (i) => setCfg((c) => ({ ...c, screens: c.screens.filter((_, idx) => idx !== i) }));
  
  // Use first section for operation display
  const section = cfg.sections[0];
  const op = screenOperation(section);

  const addOnSide = (sectionId, side, segmentIdx) => {
    if (cfg.style === 'attached' && cfg.attachedSide === side) return;
    
    // For L-shape, use segment-based placement
    if (cfg.layout === 'l-shape') {
      const modules = getModules(cfg);
      const availableSides = getLShapeAvailableSides(cfg, modules);
      const targetSide = availableSides.find(s => s.segmentIdx === segmentIdx);
      if (!targetSide) return;
      
      setCfg((c) => {
        // Check if already has screen
        const hasScreen = c.screens?.some(s => s.segmentIdx === segmentIdx);
        if (hasScreen) {
          // Remove screen
          return { ...c, screens: c.screens.filter(s => s.segmentIdx !== segmentIdx) };
        }
        
        // Check if has wall - if so, remove it
        const hasWall = c.walls?.some(w => w.segmentIdx === segmentIdx);
        const newWalls = hasWall ? c.walls.filter(w => w.segmentIdx !== segmentIdx) : c.walls;
        
        // Add screen on this segment
        return { 
          ...c, 
          screens: [...c.screens, { sectionId, side, segIdx: 0, segmentIdx }], 
          walls: newWalls 
        };
      });
      return;
    }
    
    // Horizontal layout - original logic
    if (isSideFullyInterior(cfg, sectionId, side)) return;
    setCfg((c) => {
      const segs = segmentsForSide(c, sectionId, side);
      const targetSeg = segs.find((s) => s.idx === segmentIdx);
      if (!targetSeg) return c;

      // Check if already has screen on this segment
      const existing = c.screens.find((s) => s.sectionId === sectionId && s.side === side && s.segIdx === segmentIdx);
      if (existing) {
        // Remove screen
        return {
          ...c,
          screens: c.screens.filter((s) => !(s.sectionId === sectionId && s.side === side && s.segIdx === segmentIdx)),
        };
      }

      // Remove any wall on same segment
      const newWalls = c.walls.filter((w) => !(w.sectionId === sectionId && w.side === side && w.segIdx === segmentIdx));
      
      return { 
        ...c, 
        screens: [...c.screens, { sectionId, side, segIdx: segmentIdx }], 
        walls: newWalls 
      };
    });
  };

  return (
    <div className="pb-fadeup">
      <StepHeader
        stepNum={stepNum}
        total={total}
        title="Add screens"
        subtitle={cfg.layout === 'l-shape' 
          ? "Privacy screens can be placed on ALL outer sides of the L-shape. They can't share a segment with a wall."
          : "Privacy screens fit between two posts. They can't share a segment with a wall."}
      />

      <div className="pb-clickhint mb-5 flex gap-2 items-start" data-testid="screen-clickhint">
        <MousePointerClick size={16} className="mt-0.5 flex-shrink-0" />
        <span>
          Click any side in the <strong>3D preview</strong> to add or remove a screen — or use the quick buttons below.
          {cfg.layout === 'l-shape' && (
            <span className="block text-xs text-[#5b6368] mt-1">
              Screens can be placed on ALL outer sides. Hover over a side to see placement options.
            </span>
          )}
        </span>
      </div>

      {/* For L-shape, show unified outer perimeter segments */}
      {cfg.layout === 'l-shape' ? (
        <LShapeScreenButtons cfg={cfg} setCfg={setCfg} />
      ) : (
        /* Horizontal layout: per-section segment buttons */
        cfg.sections.map((section, sectionIdx) => {
          const sectionScreens = cfg.screens.filter((s) => s.sectionId === section.id);

          return (
            <div key={section.id} className="mb-6">
              <p className="text-[10px] pb-mono uppercase tracking-widest text-[#5b6368] mb-3">Quick add screen to a segment</p>
              <div className="space-y-3">
                {SIDES.map((s) => {
                  const isAttached = cfg.style === 'attached' && cfg.attachedSide === s.id;
                  const isInterior = isSideFullyInterior(cfg, section.id, s.id);
                  if (isAttached || isInterior) return null;

                  const segs = segmentsForSide(cfg, section.id, s.id);
                  const hasMultipleSegments = segs.length > 1;

                  return (
                    <div key={s.id} className="border border-[#ececea] rounded-lg p-3">
                      <p className="text-xs font-semibold text-[#14171a] mb-2">{s.label} Side</p>
                      <div className="grid grid-cols-2 gap-2">
                        {segs.map((seg) => {
                          const hasScreen = sectionScreens.some((sc) => sc.side === s.id && sc.segIdx === seg.idx);
                          const hasWall = cfg.walls?.some((w) => w.sectionId === section.id && w.side === s.id && w.segIdx === seg.idx);
                          const segLabel = hasMultipleSegments ? `Segment ${seg.idx + 1} (${seg.length.toFixed(1)} ft)` : 'Add Screen';
                          return (
                            <button
                              key={seg.idx}
                              data-testid={`screen-segment-${section.id}-${s.id}-${seg.idx}`}
                              disabled={hasWall}
                              onClick={() => addOnSide(section.id, s.id, seg.idx)}
                              className={`px-3 py-2 rounded-full text-sm font-semibold border ${
                                hasScreen
                                  ? 'bg-[#1a7a4b] text-white border-[#1a7a4b]'
                                  : hasWall
                                    ? 'bg-[#f3f3ef] text-[#a8a8a4] cursor-not-allowed'
                                    : 'bg-white text-[#14171a] border-[#d8d8d4] hover:border-[#14171a]'
                              }`}
                            >
                              {hasScreen ? '✓ ' : hasWall ? '✕ ' : '+ '}{segLabel}
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
        })
      )}

      {cfg.layout === '10x12-kit' && (
        <div className="pb-card p-5 bg-[#f3f9f5] border-[#cce4d7] mb-6">
          <p className="text-sm font-semibold text-[#14171a] mb-3">Standard Kit Screen Specs</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-[#5b6368]">Operation:</span> <strong>Manual</strong></div>
            <div><span className="text-[#5b6368]">Colour:</span> <strong>White</strong></div>
          </div>
          <p className="text-xs text-[#5b6368] mt-3">Screen specifications are fixed for the Standard Kit.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <div>
          <p className="text-[10px] pb-mono uppercase tracking-widest text-[#5b6368] mb-3">Screen color</p>
          {cfg.layout === '10x12-kit' ? (
            <div className="pb-card p-4">
              <p className="pb-display text-xl font-semibold">White</p>
              <p className="text-xs text-[#5b6368] mt-1">Locked — Standard Kit</p>
            </div>
          ) : (
            <ColorSwatchRow
              colors={SCREEN_COLORS}
              value={cfg.screenColor}
              onChange={(id) => setCfg((c) => ({ ...c, screenColor: id }))}
              testIdPrefix="screen-color"
            />
          )}
        </div>
        <div>
          <p className="text-[10px] pb-mono uppercase tracking-widest text-[#5b6368] mb-3">Operation (auto)</p>
          <div className="pb-card p-4">
            <p className="pb-display text-xl font-semibold">{op === 'manual' ? 'Manual' : 'Motorized'}</p>
            <p className="text-xs text-[#5b6368] mt-1">
              {op === 'manual'
                ? 'Hand crank — for 10×12 or smaller.'
                : 'Motorized — included for sizes larger than 10×12.'}
            </p>
          </div>
        </div>
      </div>

      {cfg.screens.length > 0 && (
        <div className="mt-7">
          <p className="text-[10px] pb-mono uppercase tracking-widest text-[#5b6368] mb-2">
            Placed screens ({cfg.screens.length})
          </p>
          <ul className="divide-y divide-[#ececea] pb-card overflow-hidden" data-testid="screen-list">
            {cfg.screens.map((s, i) => {
              const sectionNum = cfg.sections.findIndex((sec) => sec.id === s.sectionId) + 1;
              return (
                <li key={`${s.sectionId}-${s.side}-${s.segIdx}`} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm">
                    {cfg.layout === 'l-shape' && <span className="text-[#5b6368] text-xs mr-2">S{sectionNum}</span>}
                    <span className="pb-num-chip mr-2">{s.side}</span>
                    segment {s.segIdx + 1}
                  </span>
                  <button
                    onClick={() => removeAt(i)}
                    className="text-[#5b6368] hover:text-[#c0392b] flex items-center gap-1 text-xs"
                    data-testid={`screen-remove-${i}`}
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// L-Shape: Show all outer perimeter segments as unified buttons
function LShapeScreenButtons({ cfg, setCfg }) {
  const modules = getModules(cfg);
  const availableSides = getLShapeAvailableSides(cfg, modules);
  
  const addScreen = (segmentIdx) => {
    const side = availableSides.find(s => s.segmentIdx === segmentIdx);
    if (!side) return;
    
    setCfg((c) => {
      // Check if already has screen
      const hasScreen = c.screens?.some(s => s.segmentIdx === segmentIdx);
      if (hasScreen) {
        return { ...c, screens: c.screens.filter(s => s.segmentIdx !== segmentIdx) };
      }
      
      // Remove any wall on same segment
      const hasWall = c.walls?.some(w => w.segmentIdx === segmentIdx);
      const newWalls = hasWall ? c.walls.filter(w => w.segmentIdx !== segmentIdx) : c.walls;
      
      return { 
        ...c, 
        screens: [...c.screens, { sectionId: side.sectionId, side: side.side, segIdx: 0, segmentIdx }], 
        walls: newWalls 
      };
    });
  };
  
  const sideNames = { front: 'Front', back: 'Back', left: 'Left', right: 'Right' };
  
  return (
    <div className="mb-6">
      <p className="text-[10px] pb-mono uppercase tracking-widest text-[#5b6368] mb-3">
        Outer Perimeter Segments ({availableSides.length} sides available)
      </p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {availableSides.map((side) => {
          const hasScreen = cfg.screens?.some(s => s.segmentIdx === side.segmentIdx);
          return (
            <button
              key={side.segmentIdx}
              onClick={() => addScreen(side.segmentIdx)}
              className={`px-3 py-2.5 rounded-full text-sm font-semibold border ${
                hasScreen
                  ? 'bg-[#1a7a4b] text-white border-[#1a7a4b]'
                  : 'bg-white text-[#14171a] border-[#d8d8d4] hover:border-[#14171a]'
              }`}
            >
              {hasScreen ? '✓ ' : '+ '}{sideNames[side.side]} ({side.lengthFt.toFixed(1)} ft)
            </button>
          );
        })}
      </div>
    </div>
  );
}
