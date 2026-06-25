import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { RotateCcw, RotateCw, Ruler, Sun, Moon, Eye, Maximize2, Minimize2 } from 'lucide-react';
import PergolaScene from './pergola3d/PergolaScene';

function clampRot(v) { return Math.max(0, Math.min(100, v)); }

export default function PergolaViewer({ cfg, setCfg, allowEdit = false, stepId }) {
  const wrapperRef = useRef(null);

  const fs = cfg.fs || false;
  const toggleFs = () => setCfg((c) => ({ ...c, fs: !c.fs }));

  const setMode = (m) => setCfg((c) => ({ ...c, editMode: c.editMode === m ? 'none' : m }));
  const toggleDims = () => setCfg((c) => ({ ...c, showDimensions: !c.showDimensions }));
  const tilt = (d) => setCfg((c) => ({ ...c, louverRotation: clampRot(c.louverRotation + d) }));

  const handleFace = (sectionId, side, segIdx) => {
    if (!allowEdit) return;

    // Walls/screens steps only — no section adding
    if (stepId !== 'walls' && stepId !== 'screens') return;

    const isWallsStep = stepId === 'walls';
    const key = isWallsStep ? 'walls' : 'screens';
    const other = isWallsStep ? 'screens' : 'walls';

    setCfg((c) => {
      const list = c[key];
      const idx = list.findIndex((x) => x.sectionId === sectionId && x.side === side && x.segIdx === segIdx);
      if (idx >= 0) {
        return { ...c, [key]: list.filter((_, i) => i !== idx) };
      }
      if (isWallsStep) {
        const allWalls = [...c.walls, { sectionId, side, segIdx }];
        if (!hasEntryOpening(c, allWalls)) return c;
      }
      const newOther = c[other].filter((x) => !(x.sectionId === sectionId && x.side === side && x.segIdx === segIdx));
      const entry = { sectionId, side, segIdx };
      if (isWallsStep) {
        entry.color = c.wallColor;
        entry.gap = c.wallGap;
      } else {
        entry.color = c.screenColor;
      }
      return { ...c, [key]: [...list, entry], [other]: newOther };
    });
  };

  // Helper: Check if at least 1 exterior side has at least 1 free segment
  // If yes, you can wall off all other sides completely
  const hasEntryOpening = (config, walls) => {
    // Get all exterior sides across all sections
    const allExteriorSides = [];
    for (const section of config.sections) {
      ['front', 'back', 'left', 'right'].forEach(side => {
        // Check if this specific section/side is attached (house wall)
        const isAttached = config.style === 'attached' && 
          (config.attachedSides?.[section.id] === side || config.attachedSide === side);
        if (!isAttached) {
          allExteriorSides.push({ sectionId: section.id, side });
        }
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

  return (
    <>
    <div ref={wrapperRef} className="pb-viewer-frame w-full h-full relative" data-testid="pergola-viewer">
      <PergolaScene cfg={cfg} onFaceClick={handleFace} stepId={stepId} />

      {/* Live badge */}
      <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/85 backdrop-blur-sm rounded-full border border-white/70 text-[10px] tracking-widest uppercase text-[#14171a] font-semibold flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#1a7a4b] animate-pulse" />
        Live 3D
      </div>

      {/* Fullscreen toggle */}
      <button
        type="button"
        onClick={toggleFs}
        className="absolute top-4 left-32 px-2.5 py-1.5 rounded-md bg-white/85 backdrop-blur-sm border border-white/70 text-[#5b6368] hover:text-[#14171a] hover:border-[#1a7a4b] transition-all flex items-center gap-1.5"
        title="Fullscreen 3D"
      >
        <Maximize2 size={13} />
        <span className="text-[10px] font-semibold uppercase tracking-wider hidden sm:inline">Full</span>
      </button>

      {/* Camera view toggle */}
      <div className="absolute top-14 left-4">
        <button
          type="button"
          onClick={() => setCfg((c) => ({ ...c, cameraPreset: c.cameraPreset === 'top-down' ? null : 'top-down' }))}
          className={`px-2.5 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border shadow-sm backdrop-blur-sm transition-all flex items-center gap-1.5 ${
            cfg.cameraPreset === 'top-down'
              ? 'bg-[#e6f3eb] border-[#1a7a4b] text-[#1a7a4b]'
              : 'bg-white/85 border-white/70 text-[#5b6368] hover:border-[#1a7a4b]'
          }`}
          title="Bird's eye view"
        >
          <Eye size={11} />
          Top
        </button>
      </div>

      {/* Dimensions chip */}
      <div className="absolute top-4 right-4 px-3 py-1.5 bg-[#14171a]/85 backdrop-blur-sm rounded-full text-white text-[11px] tracking-wider flex items-center gap-2 font-semibold pb-mono">
        {cfg.sections.map((s, i) => (
          <span key={s.id} className={i > 0 ? 'opacity-70' : ''}>
            {i > 0 && '+ '}{s.length}′ × {s.width}′
          </span>
        ))}
      </div>

      {/* Louver controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-full px-3 py-2 shadow-lg border border-[#ececea]" data-testid="louver-controls">
        <span className="text-[10px] uppercase tracking-widest text-[#5b6368] font-semibold hidden sm:inline">Louvers</span>
        <button onClick={() => tilt(-10)} className="w-10 h-10 md:w-8 md:h-8 rounded-full bg-[#fafaf7] hover:bg-[#1a7a4b] hover:text-white flex items-center justify-center" aria-label="Open louvers" data-testid="louver-open">
          <RotateCcw size={15} />
        </button>
        <div className="text-xs font-bold w-10 text-center pb-mono">{Math.round(cfg.louverRotation)}%</div>
        <button onClick={() => tilt(10)} className="w-10 h-10 md:w-8 md:h-8 rounded-full bg-[#fafaf7] hover:bg-[#1a7a4b] hover:text-white flex items-center justify-center" aria-label="Close louvers" data-testid="louver-close">
          <RotateCw size={15} />
        </button>
      </div>

      {/* Mobile: compact icon-only Day/Night + Dims toggles */}
      <div className="absolute bottom-4 right-3 flex md:hidden flex-col gap-2">
        <button
          onClick={() => setCfg(c => ({ ...c, isNight: !c.isNight }))}
          className={`w-10 h-10 rounded-full flex items-center justify-center border shadow-lg ${
            cfg.isNight ? 'bg-[#1a1a2e] text-white border-transparent' : 'bg-white text-[#14171a] border-[#d8d8d4]'
          }`}
          aria-label={cfg.isNight ? 'Switch to day' : 'Switch to night'}
        >
          {cfg.isNight ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        <button
          onClick={toggleDims}
          className={`w-10 h-10 rounded-full flex items-center justify-center border shadow-lg ${
            cfg.showDimensions ? 'bg-[#1a7a4b] text-white border-transparent' : 'bg-white text-[#14171a] border-[#d8d8d4]'
          }`}
          aria-label={cfg.showDimensions ? 'Hide dimensions' : 'Show dimensions'}
        >
          <Ruler size={16} />
        </button>
      </div>

      {/* Mobile: touch hint */}
      <div className="absolute top-14 left-4 md:hidden px-2.5 py-1 bg-white/75 backdrop-blur-sm rounded-full text-[9px] tracking-widest uppercase text-[#5b6368] font-semibold">
        Drag · Pinch to zoom
      </div>

      {/* Bottom controls: Day/Night + Dims toggle + Help text */}
      <div className="absolute bottom-4 right-4 hidden md:flex items-center gap-2">
        <button
          onClick={() => setCfg(c => ({ ...c, isNight: !c.isNight }))}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-semibold uppercase tracking-wider border shadow-lg ${
            cfg.isNight ? 'bg-[#1a1a2e] text-white border-transparent' : 'bg-white text-[#14171a] border-[#d8d8d4] hover:border-[#1a7a4b]'
          }`}
        >
          {cfg.isNight ? <Moon size={13} /> : <Sun size={13} />}
          {cfg.isNight ? 'Night' : 'Day'}
        </button>
        <button
          data-testid="toggle-dims"
          onClick={toggleDims}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-semibold uppercase tracking-wider border shadow-lg ${
            cfg.showDimensions ? 'bg-[#1a7a4b] text-white border-transparent' : 'bg-white text-[#14171a] border-[#d8d8d4] hover:border-[#1a7a4b]'
          }`}
        >
          <Ruler size={13} /> {cfg.showDimensions ? 'Hide Dims' : 'Show Dims'}
        </button>
        <div className="px-3 py-2 bg-white/85 backdrop-blur-sm rounded-full border border-white/60 text-[10px] tracking-widest uppercase text-[#5b6368] font-semibold shadow-lg">
          Drag · Scroll
        </div>
      </div>
    </div>

    {/* Fullscreen overlay — separate render tree, does not touch normal layout */}
    {fs && createPortal(
      <div className="fixed inset-0 z-[9999] bg-[#14171a] flex flex-col">
        <div className="flex-1 relative w-full h-full">
          <PergolaScene cfg={cfg} onFaceClick={handleFace} stepId={stepId} />

          {/* Live badge */}
          <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/85 backdrop-blur-sm rounded-full border border-white/70 text-[10px] tracking-widest uppercase text-[#14171a] font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#1a7a4b] animate-pulse" />
            Live 3D
          </div>

          {/* Exit fullscreen */}
          <button
            type="button"
            onClick={toggleFs}
            className="absolute top-4 right-4 px-3 py-1.5 rounded-md bg-white/95 backdrop-blur-sm border border-white/80 text-[#14171a] hover:bg-[#e6f3eb] hover:border-[#1a7a4b] hover:text-[#1a7a4b] transition-all flex items-center gap-1.5 shadow-lg"
          >
            <Minimize2 size={13} />
            <span className="text-[10px] font-semibold uppercase tracking-wider">Exit</span>
          </button>

          {/* Camera view toggle */}
          <div className="absolute top-14 left-4">
            <button
              type="button"
              onClick={() => setCfg((c) => ({ ...c, cameraPreset: c.cameraPreset === 'top-down' ? null : 'top-down' }))}
              className={`px-2.5 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border shadow-sm backdrop-blur-sm transition-all flex items-center gap-1.5 ${
                cfg.cameraPreset === 'top-down'
                  ? 'bg-[#e6f3eb] border-[#1a7a4b] text-[#1a7a4b]'
                  : 'bg-white/85 border-white/70 text-[#5b6368] hover:border-[#1a7a4b]'
              }`}
              title="Bird's eye view"
            >
              <Eye size={11} />
              Top
            </button>
          </div>

          {/* Dimensions chip */}
          <div className="absolute top-4 right-24 px-3 py-1.5 bg-[#14171a]/85 backdrop-blur-sm rounded-full text-white text-[11px] tracking-wider flex items-center gap-2 font-semibold pb-mono">
            {cfg.sections.map((s, i) => (
              <span key={s.id} className={i > 0 ? 'opacity-70' : ''}>
                {i > 0 && '+ '}{s.length}′ × {s.width}′
              </span>
            ))}
          </div>

          {/* Louver controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-full px-3 py-2 shadow-lg border border-[#ececea]">
            <span className="text-[10px] uppercase tracking-widest text-[#5b6368] font-semibold hidden sm:inline">Louvers</span>
            <button onClick={() => tilt(-10)} className="w-10 h-10 md:w-8 md:h-8 rounded-full bg-[#fafaf7] hover:bg-[#1a7a4b] hover:text-white flex items-center justify-center" aria-label="Open louvers">
              <RotateCcw size={15} />
            </button>
            <div className="text-xs font-bold w-10 text-center pb-mono">{Math.round(cfg.louverRotation)}%</div>
            <button onClick={() => tilt(10)} className="w-10 h-10 md:w-8 md:h-8 rounded-full bg-[#fafaf7] hover:bg-[#1a7a4b] hover:text-white flex items-center justify-center" aria-label="Close louvers">
              <RotateCw size={15} />
            </button>
          </div>

          {/* Bottom controls */}
          <div className="absolute bottom-6 right-6 flex items-center gap-2">
            <button
              onClick={() => setCfg(c => ({ ...c, isNight: !c.isNight }))}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-semibold uppercase tracking-wider border shadow-lg ${
                cfg.isNight ? 'bg-[#1a1a2e] text-white border-transparent' : 'bg-white text-[#14171a] border-[#d8d8d4] hover:border-[#1a7a4b]'
              }`}
            >
              {cfg.isNight ? <Moon size={13} /> : <Sun size={13} />}
              {cfg.isNight ? 'Night' : 'Day'}
            </button>
            <button
              onClick={toggleDims}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-semibold uppercase tracking-wider border shadow-lg ${
                cfg.showDimensions ? 'bg-[#1a7a4b] text-white border-transparent' : 'bg-white text-[#14171a] border-[#d8d8d4] hover:border-[#1a7a4b]'
              }`}
            >
              <Ruler size={13} /> {cfg.showDimensions ? 'Hide Dims' : 'Show Dims'}
            </button>
            <div className="px-3 py-2 bg-white/85 backdrop-blur-sm rounded-full border border-white/60 text-[10px] tracking-widest uppercase text-[#5b6368] font-semibold shadow-lg">
              Drag · Scroll
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}
  </>);
}
