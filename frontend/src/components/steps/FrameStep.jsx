import React from 'react';
import { StepHeader, ColorSwatchRow } from './_shared';
import { POST_COLORS, LOUVER_COLORS } from '../../data/catalog';
import { louverOperation, louverSetCount, smallerDim } from '../../utils/pergolaRules';

export default function FrameStep({ cfg, setCfg, stepNum, total }) {
  // Use first section for display stats
  const section = cfg.sections[0];
  const op = louverOperation(section, cfg);
  const sets = louverSetCount(section);
  const isKit = cfg.layout === '10x12-kit';

  return (
    <div className="pb-fadeup">
      <StepHeader
        stepNum={stepNum}
        total={total}
        title={isKit ? 'Kit Colors' : 'Pick Colors'}
        subtitle={isKit ? 'These colors are set for the Standard Kit.' : 'Pick the colors for your posts and roof slats.'}
      />

      {isKit && (
        <div className="pb-card p-5 bg-[#f3f9f5] border-[#cce4d7] mb-6">
          <p className="text-sm font-semibold text-[#14171a] mb-3">Standard Kit Finishes</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-[#5b6368]">Frame:</span> <strong>Umbra Grey</strong></div>
            <div><span className="text-[#5b6368]">Louvers:</span> <strong>Pure White</strong></div>
            <div><span className="text-[#5b6368]">Design:</span> <strong>Visible Screws</strong></div>
            <div><span className="text-[#5b6368]">Posts:</span> <strong>4"×4"</strong></div>
          </div>
          <p className="text-xs text-[#5b6368] mt-3">These finishes are fixed for the Standard Kit and cannot be changed.</p>
        </div>
      )}

      {!isKit && (
        <>
          {/* Frame Color */}
          <div className="mb-8">
            <p className="text-sm font-semibold text-[#14171a] mb-3">Post & Frame Color</p>
            <ColorSwatchRow
              colors={POST_COLORS}
              value={cfg.postColor}
              onChange={(id) => setCfg((c) => ({ ...c, postColor: id }))}
              testIdPrefix="frame-color"
            />
          </div>

          {/* Louver Color */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-[#14171a] mb-3">Roof Slat Color</p>
            <ColorSwatchRow
              colors={LOUVER_COLORS}
              value={cfg.louverColor}
              onChange={(id) => setCfg((c) => ({ ...c, louverColor: id }))}
              testIdPrefix="louver-color"
            />
          </div>
        </>
      )}

      {/* Louver Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
        <Stat label="Smaller side" value={`${smallerDim(section)} ft`} />
        <Stat label="Louver sets" value={sets} />
        <Stat label="Operation" value={op === 'manual' ? 'Manual' : 'Motorized'} />
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="pb-card px-4 py-3">
      <p className="text-[10px] pb-mono uppercase tracking-widest text-[#5b6368]">{label}</p>
      <p className="pb-display text-xl font-semibold mt-0.5">{value}</p>
    </div>
  );
}
