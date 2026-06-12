import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Scene } from '../pergola3d/PergolaScene';
import { POST_COLORS, LOUVER_COLORS, SCREEN_COLORS } from '../../data/catalog';
import { louverSetCount, louverOperation, screenOperation, totalPostPlan } from '../../utils/pergolaRules';
import { Check, Minus, RotateCcw, ArrowLeft } from 'lucide-react';

function colorName(list, id) {
  return (list.find((c) => c.id === id) || { name: id }).name;
}

// Build spec data from config
function buildSpecs(config) {
  if (!config) return null;
  const section = config.sections[0];
  const plan = totalPostPlan(config);
  const sets = louverSetCount(section);
  const lop = louverOperation(section, config);
  const sop = screenOperation(section, config);

  const heaterCount = config.heaters?.length || 0;
  const outletCount = config.outlets?.length || 0;
  const hasInsectScreen = !!config.addOns?.insectScreen;
  const hasCeilingFan = !!config.addOns?.ceilingFan;
  const hasCurtains = !!config.addOns?.outdoorCurtains;

  return {
    layout: config.layout === 'l-shape' ? 'L-Shape' : config.layout === '10x12-kit' ? '10×12 Kit' : 'Horizontal',
    style: config.style === 'attached' ? 'Attached' : config.style === '10x12-kit' ? '10×12 Kit' : 'Freestanding',
    ground: { gravel: 'Gravel', grass: 'Grass', concrete: 'Concrete', paving: 'Paving' }[config.groundType] || config.groundType,
    size: config.sections.map(s => `${s.length}′×${s.width}′`).join(' + '),
    height: `${section?.height} ft`,
    frame: colorName(POST_COLORS, config.postColor),
    louvers: config.layout === '10x12-kit' ? 'Manual (opt. motorized)' : `${sets} sets · ${colorName(LOUVER_COLORS, config.louverColor)}`,
    louverOp: lop === 'manual' ? 'Manual' : lop === 'phone-controlled' ? 'Phone Control' : 'Motorized',
    screens: `${config.screens?.filter((s) => s.enabled).length || 0} sides · ${colorName(SCREEN_COLORS, config.screenColor)}`,
    screenOp: sop === 'manual' ? 'Manual' : sop === 'motorized' ? 'Motorized' : 'Fixed',
    walls: config.walls?.filter((w) => w.enabled).length || 0,
    lights: config.perimeterLights?.filter((l) => l.enabled).length || 0,
    posts: plan.total,
    heaters: heaterCount,
    outlets: outletCount,
    hasInsectScreen,
    hasCeilingFan,
    hasCurtains,
  };
}

// Mini 3D Viewer
function MiniViewer({ cfg, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-sm font-semibold text-[#14171a] mb-2">{label}</div>
      <div className="w-full aspect-[4/3] bg-gradient-to-b from-[#f5f5f3] to-[#e8e8e6] rounded-xl overflow-hidden border border-[#d4d4d0]">
        <Canvas camera={{ position: [5, 4, 5], fov: 50 }} shadows dpr={[1, 1.5]}>
          <Environment preset="city" />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
          <Scene cfg={cfg} onFaceClick={() => {}} stepId="review" />
          <OrbitControls enablePan={false} minDistance={3} maxDistance={12} autoRotate autoRotateSpeed={0.5} />
        </Canvas>
      </div>
    </div>
  );
}

// Table row component for comparison
function CompareRow({ label, a, b, type = 'text' }) {
  const different = String(a) !== String(b);

  const renderValue = (val) => {
    if (type === 'bool') {
      return val ? (
        <Check className="w-5 h-5 text-[#1a7a4b] mx-auto" strokeWidth={3} />
      ) : (
        <Minus className="w-4 h-4 text-[#d4d4d0] mx-auto" strokeWidth={2} />
      );
    }
    return <span className="text-sm">{val}</span>;
  };

  return (
    <tr className={`border-b border-[#f0f0ee] ${different ? 'bg-[#f8fdf9]' : ''}`}>
      <td className="py-3 px-4 text-sm text-[#6e6e73] font-medium">{label}</td>
      <td className={`py-3 px-4 text-center ${different ? 'text-[#1a7a4b] font-semibold' : 'text-[#1d1d1f]'}`}>
        {renderValue(a)}
      </td>
      <td className={`py-3 px-4 text-center ${different ? 'text-[#1a7a4b] font-semibold' : 'text-[#1d1d1f]'}`}>
        {renderValue(b)}
      </td>
    </tr>
  );
}

export default function CompareConfigsView({ firstConfig, secondConfig, onBack, onNewCompare }) {
  const specsA = buildSpecs(firstConfig);
  const specsB = buildSpecs(secondConfig);

  if (!specsA || !specsB) return null;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-[#f5f5f3] rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#5b6368]" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-[#14171a]">Compare Configurations</h2>
            <p className="text-xs text-[#5b6368]">Differences highlighted in green</p>
          </div>
        </div>
        <button onClick={onNewCompare} className="pb-btn pb-btn-secondary text-xs">
          <RotateCcw className="w-4 h-4" /> New Comparison
        </button>
      </div>

      {/* 3D Viewers Side by Side */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <MiniViewer cfg={firstConfig} label="Configuration A" />
        <MiniViewer cfg={secondConfig} label="Configuration B" />
      </div>

      {/* Specs Comparison Table */}
      <div className="bg-white rounded-lg border border-[#ececea] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f5f5f3] border-b-2 border-[#d4d4d0]">
              <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[#5b6368]">Feature</th>
              <th className="py-3 px-4 text-sm font-semibold text-[#14171a] text-center">Config A</th>
              <th className="py-3 px-4 text-sm font-semibold text-[#14171a] text-center">Config B</th>
            </tr>
          </thead>
          <tbody>
            <CompareRow label="Layout" a={specsA.layout} b={specsB.layout} />
            <CompareRow label="Style" a={specsA.style} b={specsB.style} />
            <CompareRow label="Ground Surface" a={specsA.ground} b={specsB.ground} />
            <CompareRow label="Dimensions" a={specsA.size} b={specsB.size} />
            <CompareRow label="Height" a={specsA.height} b={specsB.height} />
            <CompareRow label="Frame Color" a={specsA.frame} b={specsB.frame} />
            <CompareRow label="Louvers" a={specsA.louvers} b={specsB.louvers} />
            <CompareRow label="Louver Operation" a={specsA.louverOp} b={specsB.louverOp} />
            <CompareRow label="Screens" a={specsA.screens} b={specsB.screens} />
            <CompareRow label="Walls" a={specsA.walls} b={specsB.walls} />
            <CompareRow label="Perimeter Lights" a={specsA.lights} b={specsB.lights} />
            <CompareRow label="Total Posts" a={specsA.posts} b={specsB.posts} />
            <CompareRow label="Wall Heaters" a={specsA.heaters} b={specsB.heaters} />
            <CompareRow label="Outlets" a={specsA.outlets} b={specsB.outlets} />
            <CompareRow label="Insect Screens" a={specsA.hasInsectScreen} b={specsB.hasInsectScreen} type="bool" />
            <CompareRow label="Ceiling Fan" a={specsA.hasCeilingFan} b={specsB.hasCeilingFan} type="bool" />
            <CompareRow label="Outdoor Curtains" a={specsA.hasCurtains} b={specsB.hasCurtains} type="bool" />
          </tbody>
        </table>
      </div>
    </div>
  );
}
