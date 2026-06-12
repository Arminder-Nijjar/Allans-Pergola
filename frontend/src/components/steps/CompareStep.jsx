import React, { useState } from 'react';
import { ArrowLeftRight, RotateCcw } from 'lucide-react';
import { StepHeader } from './_shared';
import { Scene } from '../pergola3d/PergolaScene';
import { OrbitControls, Environment } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { POST_COLORS, LOUVER_COLORS, SCREEN_COLORS, WALL_COLORS, LIGHT_COLORS } from '../../data/catalog';
import { louverSetCount, louverOperation, screenOperation, totalPostPlan } from '../../utils/pergolaRules';

function colorName(list, id) {
  return (list.find((c) => c.id === id) || { name: id }).name;
}

// Full viewer for side-by-side comparison
function FullViewer({ cfg, label, sublabel }) {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-2">
        <span className="text-sm font-semibold text-[#14171a]">{label}</span>
        {sublabel && <span className="text-xs text-[#5b6368] ml-2">{sublabel}</span>}
      </div>
      <div className="bg-[#1a1a1a] rounded-lg overflow-hidden flex-1 min-h-[300px] lg:min-h-[400px] relative border border-[#ececea]">
        <Canvas camera={{ position: [6, 5, 6], fov: 45 }} shadows>
          <Environment preset="sunset" />
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
          <Scene cfg={cfg} onFaceClick={() => {}} stepId="review" />
          <OrbitControls enablePan={false} minDistance={3} maxDistance={15} />
        </Canvas>
      </div>
    </div>
  );
}

// Comparison row component
function CompareRow({ label, valueA, valueB, different }) {
  return (
    <div className={`grid grid-cols-[1fr_1fr_1fr] gap-2 py-2.5 px-3 text-sm ${different ? 'bg-[#fef3c7]' : 'hover:bg-[#f5f5f3]'} rounded`}>
      <div className="font-medium text-[#5b6368]">{label}</div>
      <div className={`${different ? 'font-semibold text-[#92400e]' : 'text-[#14171a]'}`}>{valueA}</div>
      <div className={`${different ? 'font-semibold text-[#92400e]' : 'text-[#14171a]'}`}>{valueB}</div>
    </div>
  );
}

// Build review data from config
function buildReviewData(config) {
  if (!config) return null;
  const section = config.sections[0];
  const plan = totalPostPlan(config);
  const sets = louverSetCount(section);
  const lop = louverOperation(section, config);
  const sop = screenOperation(section, config);

  const addOnParts = [];
  if (config.addOns?.heaterColor) addOnParts.push(`Heater: ${config.addOns.heaterColor}`);
  if ((config.heaters?.length || 0) > 0) addOnParts.push(`${config.heaters.length} wall heater${config.heaters.length > 1 ? 's' : ''}`);
  if ((config.outlets?.length || 0) > 0) addOnParts.push(`${config.outlets.length} outlet${config.outlets.length > 1 ? 's' : ''}`);
  if (config.addOns?.insectScreen) addOnParts.push('Insect screens');
  if (config.addOns?.ceilingFan) addOnParts.push('Ceiling fan');
  if (config.addOns?.outdoorCurtains) addOnParts.push('Outdoor curtains');

  return {
    layout: config.layout === 'l-shape' ? 'L-Shape' : config.layout === '10x12-kit' ? '10×12 Standard Kit' : 'Horizontal',
    style: config.style === 'attached' ? `Attached (${config.attachedSide})` : config.style === '10x12-kit' ? '10×12 Kit' : 'Freestanding',
    ground: { gravel: 'Gravel', grass: 'Grass / Lawn', concrete: 'Concrete Slab', paving: 'Paving Stones' }[config.groundType] || config.groundType,
    section1: config.sections[0] ? `${config.sections[0].length}′×${config.sections[0].width}′×${config.sections[0].height}′` : '-',
    section2: config.sections[1] ? `${config.sections[1].length}′×${config.sections[1].width}′×${config.sections[1].height}′` : '-',
    frame: colorName(POST_COLORS, config.postColor),
    louvers: config.layout === '10x12-kit' 
      ? 'manual (optional: motorized)'
      : `${sets} set${sets > 1 ? 's' : ''} · ${colorName(LOUVER_COLORS, config.louverColor)} · ${lop === 'manual' ? 'Manual' : lop === 'phone-controlled' ? 'Phone' : 'Motorized'}`,
    screens: `${config.screens?.filter((s) => s.enabled).length || 0} sides · ${colorName(SCREEN_COLORS, config.screenColor)} · ${sop === 'manual' ? 'Manual' : sop === 'motorized' ? 'Motorized' : 'Fixed'}`,
    walls: `${config.walls?.filter((w) => w.enabled).length || 0} sides`,
    lights: config.perimeterLights?.filter((l) => l.enabled).length || 0,
    posts: `${plan.total} total (${plan.cornerPosts} corner + ${plan.extras} support)`,
    heaters: config.heaters?.length || 0,
    outlets: config.outlets?.length || 0,
    addOns: addOnParts.length ? addOnParts.join(' · ') : 'None',
    notes: config.notes || 'None',
  };
}

export default function CompareStep({ cfg, setCfg, stepNum, total, compareState, onRestartCompare }) {
  const [swapSides, setSwapSides] = useState(false);

  const first = compareState?.firstConfig;
  const second = compareState?.secondConfig;

  // Determine which config goes on which side
  const leftCfg = swapSides ? second : first;
  const rightCfg = swapSides ? first : second;

  const dataA = buildReviewData(leftCfg);
  const dataB = buildReviewData(rightCfg);

  if (!first || !second) {
    return (
      <div className="flex flex-col h-full">
        <StepHeader
          stepNum={stepNum}
          total={total}
          title="Compare Configurations"
          subtitle="Side-by-side comparison of two pergola designs"
        />
        <div className="bg-[#f5f5f3] rounded-lg p-8 text-center flex-1 flex flex-col items-center justify-center">
          <ArrowLeftRight size={48} className="text-[#5b6368] mb-4 opacity-40" />
          <p className="text-sm text-[#5b6368] mb-4">
            You need to build two pergolas to compare them.
          </p>
          <p className="text-xs text-[#5b6368] mb-6 max-w-md">
            Go to the Review step of your current design and click "Compare" to start building a second configuration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <StepHeader
        stepNum={stepNum}
        total={total}
        title="Compare Configurations"
        subtitle="Side-by-side comparison of two pergola designs"
      />

      {/* Action Bar */}
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={() => setSwapSides((s) => !s)}
          className="pb-btn pb-btn-ghost text-xs"
          title="Swap sides"
        >
          <ArrowLeftRight size={14} /> Swap Sides
        </button>
        {onRestartCompare && (
          <button
            onClick={onRestartCompare}
            className="pb-btn pb-btn-secondary text-xs"
            title="Start a new comparison"
          >
            <RotateCcw size={14} /> New Compare
          </button>
        )}
      </div>

      {/* Side-by-side viewers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4 flex-1 min-h-[300px] max-h-[500px]">
        <FullViewer cfg={leftCfg} label={swapSides ? 'Config B' : 'Config A'} sublabel={swapSides ? '(Second)' : '(First)'} />
        <FullViewer cfg={rightCfg} label={swapSides ? 'Config A' : 'Config B'} sublabel={swapSides ? '(First)' : '(Second)'} />
      </div>

      {/* Comparison Table */}
      {dataA && dataB && (
        <div className="bg-white rounded-lg border border-[#ececea] overflow-hidden flex-shrink-0">
          <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 py-2 px-3 bg-[#f5f5f3] text-xs font-semibold uppercase tracking-wider text-[#5b6368]">
            <div>Feature</div>
            <div>{swapSides ? 'Config B' : 'Config A'}</div>
            <div>{swapSides ? 'Config A' : 'Config B'}</div>
          </div>
          <div className="divide-y divide-[#ececea] max-h-[200px] overflow-y-auto">
            <CompareRow label="Layout" valueA={dataA.layout} valueB={dataB.layout} different={dataA.layout !== dataB.layout} />
            <CompareRow label="Style" valueA={dataA.style} valueB={dataB.style} different={dataA.style !== dataB.style} />
            <CompareRow label="Ground" valueA={dataA.ground} valueB={dataB.ground} different={dataA.ground !== dataB.ground} />
            <CompareRow label="Section 1" valueA={dataA.section1} valueB={dataB.section1} different={dataA.section1 !== dataB.section1} />
            {dataA.section2 !== '-' || dataB.section2 !== '-' ? (
              <CompareRow label="Section 2" valueA={dataA.section2} valueB={dataB.section2} different={dataA.section2 !== dataB.section2} />
            ) : null}
            <CompareRow label="Frame Color" valueA={dataA.frame} valueB={dataB.frame} different={dataA.frame !== dataB.frame} />
            <CompareRow label="Louvers" valueA={dataA.louvers} valueB={dataB.louvers} different={dataA.louvers !== dataB.louvers} />
            <CompareRow label="Screens" valueA={dataA.screens} valueB={dataB.screens} different={dataA.screens !== dataB.screens} />
            <CompareRow label="Walls" valueA={dataA.walls} valueB={dataB.walls} different={dataA.walls !== dataB.walls} />
            <CompareRow label="Lights" valueA={dataA.lights} valueB={dataB.lights} different={dataA.lights !== dataB.lights} />
            <CompareRow label="Posts" valueA={dataA.posts} valueB={dataB.posts} different={dataA.posts !== dataB.posts} />
            <CompareRow label="Heaters" valueA={dataA.heaters} valueB={dataB.heaters} different={dataA.heaters !== dataB.heaters} />
            <CompareRow label="Outlets" valueA={dataA.outlets} valueB={dataB.outlets} different={dataA.outlets !== dataB.outlets} />
            <CompareRow label="Add-ons" valueA={dataA.addOns} valueB={dataB.addOns} different={dataA.addOns !== dataB.addOns} />
          </div>
        </div>
      )}
    </div>
  );
}
