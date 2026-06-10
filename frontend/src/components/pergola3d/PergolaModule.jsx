import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Html } from '@react-three/drei';
import { POST_COLORS, LOUVER_COLORS, SCREEN_COLORS, WALL_COLORS, LIGHT_COLORS } from '../../data/catalog';
import { postPlan, segmentsForSide, louverSetCount } from '../../utils/pergolaRules';
import { FT_TO_M, getPerimeterPath, getHouseWallSegments, getLShapeSupportPosts, isSideFullyInterior } from '../../utils/pergolaLayout';

const POST_THICK = 0.16;
const BEAM_THICK = 0.14;
const LOUVER_THICK = 0.035;
const LOUVER_DEPTH = 0.26;
const LOUVER_SPACING = 0.27;

// Premium materials shared
const aluminumMaterial = (color) => (
  <meshStandardMaterial 
    color={color} 
    metalness={0.9} 
    roughness={0.2}
    clearcoat={1.0}
    clearcoatRoughness={0.05}
  />
);

// Memoized components for performance with proper cleanup
const Post = React.memo(({ position, height, color }) => {
  const meshRef = React.useRef();
  const capRef = React.useRef();
  
  React.useEffect(() => {
    const mesh = meshRef.current;
    const cap = capRef.current;
    return () => {
      if (mesh) {
        mesh.geometry?.dispose();
        mesh.material?.dispose();
      }
      if (cap) {
        cap.geometry?.dispose();
        cap.material?.dispose();
      }
    };
  }, []);
  
  return (
    <group>
      {/* Main post */}
      <mesh ref={meshRef} position={[position[0], height / 2, position[1]]} castShadow receiveShadow>
        <boxGeometry args={[POST_THICK, height, POST_THICK]} />
        {aluminumMaterial(color)}
      </mesh>
      {/* Premium decorative cap on top */}
      <mesh ref={capRef} position={[position[0], height + 0.04, position[1]]} castShadow>
        <cylinderGeometry args={[POST_THICK * 0.7, POST_THICK * 0.7, 0.08, 8]} />
        {aluminumMaterial(color)}
      </mesh>
    </group>
  );
});

const Beam = React.memo(({ position, args, color }) => {
  const meshRef = React.useRef();
  
  React.useEffect(() => {
    const mesh = meshRef.current;
    return () => {
      if (mesh) {
        mesh.geometry?.dispose();
        mesh.material?.dispose();
      }
    };
  }, []);
  
  // Premium rounded beam look with decorative trim
  return (
    <group position={position}>
      {/* Main beam */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[args[0] - 0.02, args[1], args[2] - 0.02]} />
        {aluminumMaterial(color)}
      </mesh>
      {/* Decorative edge trim */}
      <mesh position={[0, args[1]/2 + 0.01, 0]} castShadow>
        <boxGeometry args={[args[0], 0.02, args[2]]} />
        {aluminumMaterial(color)}
      </mesh>
    </group>
  );
});

const LouverSet = React.memo(({ x0, x1, z0, z1, height, tilt, color, runAlong }) => {
  // OPTIMIZED: Limit louver count for performance while maintaining visual quality
  const { louverData, material } = useMemo(() => {
    const out = [];
    const span = runAlong === 'x' ? z1 - z0 : x1 - x0;
    
    // PERFORMANCE: Cap maximum louvers at 20 regardless of size
    const rawCount = Math.max(4, Math.round(span / LOUVER_SPACING));
    const count = Math.min(rawCount, 20);
    
    const spacing = span / count;
    
    if (runAlong === 'x') {
      for (let i = 0; i < count; i++) {
        const z = z0 + (i + 0.5) * spacing;
        out.push({
          pos: [(x0 + x1) / 2, height + BEAM_THICK + LOUVER_THICK / 2 + 0.02, z],
          args: [x1 - x0 - POST_THICK * 0.5, LOUVER_THICK, LOUVER_DEPTH],
          rot: null,
        });
      }
    } else {
      for (let i = 0; i < count; i++) {
        const x = x0 + (i + 0.5) * spacing;
        out.push({
          pos: [x, height + BEAM_THICK + LOUVER_THICK / 2 + 0.02, (z0 + z1) / 2],
          args: [LOUVER_DEPTH, LOUVER_THICK, z1 - z0 - POST_THICK * 0.5],
          rot: [0, 0, tilt],
        });
      }
    }
    
    // Shared material to reduce GPU state changes - realistic aluminum
    const mat = (
      <meshStandardMaterial 
        color={color} 
        metalness={0.85} 
        roughness={0.25}
        clearcoat={0.8}
        clearcoatRoughness={0.1}
      />
    );
    
    return { louverData: out, material: mat };
  }, [x0, x1, z0, z1, height, runAlong, tilt, color]);

  return (
    <group>
      {louverData.map((it, i) => (
        <mesh key={i} position={it.pos} rotation={it.rot || [tilt, 0, 0]} castShadow>
          <boxGeometry args={it.args} />
          {material}
        </mesh>
      ))}
    </group>
  );
});

const HorizontalAttachBeam = React.memo(({ x0, x1, z0, z1, height, side, color }) => {
  if (side === 'front') {
    return <Beam position={[(x0 + x1) / 2, height + BEAM_THICK / 2, z1]} args={[x1 - x0, BEAM_THICK, BEAM_THICK]} color={color} />;
  }
  if (side === 'back') {
    return <Beam position={[(x0 + x1) / 2, height + BEAM_THICK / 2, z0]} args={[x1 - x0, BEAM_THICK, BEAM_THICK]} color={color} />;
  }
  if (side === 'left') {
    return <Beam position={[x0, height + BEAM_THICK / 2, (z0 + z1) / 2]} args={[BEAM_THICK, BEAM_THICK, z1 - z0]} color={color} />;
  }
  return <Beam position={[x1, height + BEAM_THICK / 2, (z0 + z1) / 2]} args={[BEAM_THICK, BEAM_THICK, z1 - z0]} color={color} />;
});

const HouseWall = React.memo(({ x0, x1, z0, z1, height, side, fixed }) => {
  // House wall matches pergola width exactly (no padding)
  const len = side === 'front' || side === 'back' ? (x1 - x0) : (z1 - z0);
  const wallH = height + 0.5; // just slightly taller than pergola
  const offset = 0.08;
  const wallColor = '#c17a5c'; // warm brick color
  const wallThickness = 0.18;
  if (side === 'back') {
    return (
      <mesh position={[(x0 + x1) / 2, wallH / 2, z0 - offset]} castShadow receiveShadow>
        <boxGeometry args={[len, wallH, wallThickness]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} metalness={0.1} />
      </mesh>
    );
  }
  if (side === 'front') {
    return (
      <mesh position={[(x0 + x1) / 2, wallH / 2, z1 + offset]} castShadow receiveShadow>
        <boxGeometry args={[len, wallH, wallThickness]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} metalness={0.1} />
      </mesh>
    );
  }
  if (side === 'left') {
    return (
      <mesh position={[x0 - offset, wallH / 2, (z0 + z1) / 2]} castShadow receiveShadow>
        <boxGeometry args={[wallThickness, wallH, len]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} metalness={0.1} />
      </mesh>
    );
  }
  return (
    <mesh position={[x1 + offset, wallH / 2, (z0 + z1) / 2]} castShadow receiveShadow>
      <boxGeometry args={[wallThickness, wallH, len]} />
      <meshStandardMaterial color={wallColor} roughness={0.9} metalness={0.1} />
    </mesh>
  );
});

function panelGeom(mod, side, a, b, height, thickness) {
  if (side === 'front') return { pos: [(a + b) / 2, height / 2, mod.z + mod.d], args: [b - a - 0.05, height, thickness] };
  if (side === 'back') return { pos: [(a + b) / 2, height / 2, mod.z], args: [b - a - 0.05, height, thickness] };
  if (side === 'left') return { pos: [mod.x, height / 2, (a + b) / 2], args: [thickness, height, b - a - 0.05] };
  return { pos: [mod.x + mod.w, height / 2, (a + b) / 2], args: [thickness, height, b - a - 0.05] };
}

const Screen = React.memo(({ mod, side, a, b, height, color }) => {
  // Full coverage from ground to beam top (no gap)
  const fullHeight = height + BEAM_THICK;
  const { pos, args } = panelGeom(mod, side, a, b, fullHeight, 0.045);
  return (
    <mesh position={pos} castShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} transparent opacity={0.7} metalness={0.1} roughness={0.4} />
    </mesh>
  );
});

const SolidWall = React.memo(({ mod, side, a, b, height, color }) => {
  // Full coverage from ground to beam top (no gap)
  const fullHeight = height + BEAM_THICK;
  const { pos, args } = panelGeom(mod, side, a, b, fullHeight, 0.06);
  return (
    <mesh position={pos} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} roughness={0.7} metalness={0.05} transparent={false} />
    </mesh>
  );
});

const SlattedWall = React.memo(({ mod, side, a, b, height, color, gapIn }) => {
  const SLAT_H_FT = 0.5;
  const gapFt = gapIn / 12;
  const slatH = SLAT_H_FT * FT_TO_M;
  const gap = gapFt * FT_TO_M;
  const unit = slatH + gap;
  // Full coverage from ground to beam top (no gap)
  const fullHeight = height + BEAM_THICK;
  const usable = fullHeight - 0.05;
  const rawCount = Math.max(2, Math.floor(usable / unit));
  
  // PERFORMANCE: Cap slat count at 16 to prevent too many draw calls
  const count = Math.min(rawCount, 16);
  
  const totalSpan = count * slatH + (count - 1) * gap;
  const startY = (usable - totalSpan) / 2 + slatH / 2 + 0.025;
  
  // OPTIMIZED: Pre-calculate all slat data in useMemo
  const slats = useMemo(() => {
    const slatData = [];
    
    for (let i = 0; i < count; i++) {
      const y = startY + i * unit;
      let position, scale;
      
      if (side === 'front') {
        position = [(a + b) / 2, y, mod.z + mod.d];
        scale = [b - a - 0.05, slatH, 0.06];
      } else if (side === 'back') {
        position = [(a + b) / 2, y, mod.z];
        scale = [b - a - 0.05, slatH, 0.06];
      } else if (side === 'left') {
        position = [mod.x, y, (a + b) / 2];
        scale = [0.06, slatH, b - a - 0.05];
      } else {
        position = [mod.x + mod.w, y, (a + b) / 2];
        scale = [0.06, slatH, b - a - 0.05];
      }
      
      slatData.push({ position, scale, key: i });
    }
    
    return slatData;
  }, [count, startY, unit, side, a, b, mod, slatH]);
  
  // Shared material to reduce GPU state changes
  const material = useMemo(() => (
    <meshStandardMaterial color={color} roughness={0.6} metalness={0.05} />
  ), [color]);
  
  return (
    <>
      {slats.map((slat) => (
        <mesh key={slat.key} position={slat.position} castShadow receiveShadow>
          <boxGeometry args={slat.scale} />
          {material}
        </mesh>
      ))}
    </>
  );
});

function ClickableSeg({ mod, side, a, b, height, onClick, stepId }) {
  const [hover, setHover] = useState(false);
  const { pos, args } = panelGeom(mod, side, a, b, height - 0.05, 0.15);

  // Move clickable area slightly outward
  const offsetPos = [...pos];
  if (side === 'front') offsetPos[2] += 0.06;
  if (side === 'back') offsetPos[2] -= 0.06;
  if (side === 'left') offsetPos[0] -= 0.06;
  if (side === 'right') offsetPos[0] += 0.06;

  const isWallsOrScreens = stepId === 'walls' || stepId === 'screens';

  return (
    <mesh
      position={offsetPos}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (isWallsOrScreens) {
          setHover(true);
          document.body.style.cursor = 'pointer';
        }
      }}
      onPointerOut={() => {
        if (isWallsOrScreens) {
          setHover(false);
          document.body.style.cursor = '';
        }
      }}
    >
      <boxGeometry args={args} />
      <meshStandardMaterial
        color="#1a7a4b"
        transparent
        opacity={hover && isWallsOrScreens ? 0.3 : 0}
        depthWrite={false}
      />
    </mesh>
  );
}

// Ghost preview of a new section — translucent to show where it will appear
function GhostSectionPreview({ bounds, height, onClick }) {
  const cx = bounds.x + bounds.w / 2;
  const cz = bounds.z + bounds.d / 2;
  const h = height;
  const cornerR = 0.035;

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={(e) => { e.stopPropagation(); document.body.style.cursor = ''; }}
    >
      {/* Invisible click catcher — only at edges, avoids center X area */}
      <mesh position={[cx, h + 0.01, cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[bounds.w + 0.2, bounds.d + 0.2]} />
        <meshStandardMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* Ground footprint */}
      <mesh position={[cx, 0.01, cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[bounds.w, bounds.d]} />
        <meshStandardMaterial color="#1a7a4b" transparent opacity={0.20} depthWrite={false} />
      </mesh>
      {/* Ghost roof plane */}
      <mesh position={[cx, h + 0.015, cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[bounds.w, bounds.d]} />
        <meshStandardMaterial color="#1a7a4b" transparent opacity={0.35} depthWrite={false} />
      </mesh>
      {/* Roof edge glow lines */}
      <mesh position={[cx, h + 0.02, bounds.z + bounds.d]}>
        <boxGeometry args={[bounds.w + 0.02, 0.01, 0.015]} />
        <meshStandardMaterial color="#1a7a4b" emissive="#1a7a4b" emissiveIntensity={1.2} transparent opacity={0.5} depthWrite={false} />
      </mesh>
      <mesh position={[cx, h + 0.02, bounds.z]}>
        <boxGeometry args={[bounds.w + 0.02, 0.01, 0.015]} />
        <meshStandardMaterial color="#1a7a4b" emissive="#1a7a4b" emissiveIntensity={1.2} transparent opacity={0.5} depthWrite={false} />
      </mesh>
      <mesh position={[bounds.x, h + 0.02, cz]}>
        <boxGeometry args={[0.015, 0.01, bounds.d + 0.02]} />
        <meshStandardMaterial color="#1a7a4b" emissive="#1a7a4b" emissiveIntensity={1.2} transparent opacity={0.5} depthWrite={false} />
      </mesh>
      <mesh position={[bounds.x + bounds.w, h + 0.02, cz]}>
        <boxGeometry args={[0.015, 0.01, bounds.d + 0.02]} />
        <meshStandardMaterial color="#1a7a4b" emissive="#1a7a4b" emissiveIntensity={1.2} transparent opacity={0.5} depthWrite={false} />
      </mesh>
      {/* Ghost corner posts */}
      {[
        [bounds.x, bounds.z],
        [bounds.x + bounds.w, bounds.z],
        [bounds.x + bounds.w, bounds.z + bounds.d],
        [bounds.x, bounds.z + bounds.d],
      ].map((pos, i) => (
        <mesh key={i} position={[pos[0], h / 2, pos[1]]}>
          <cylinderGeometry args={[cornerR, cornerR, h, 8]} />
          <meshStandardMaterial color="#1a7a4b" emissive="#1a7a4b" emissiveIntensity={0.6} transparent opacity={0.35} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

// Section hover plane — section adding/removing disabled
function SectionHoverPlane() {
  return null;
}

// OPTIMIZED PERIMETER LIGHTING - Uses emissive materials, follows actual beam geometry
// No expensive point lights - performance optimized
const PerimeterLightStrip = React.memo(({ modules, color, intensity = 1.6, cfg }) => {
  // Calculate light strips per module - follows actual beam paths
  const lightStrips = useMemo(() => {
    if (!modules.length) return [];
    
    const strips = [];
    
    modules.forEach((mod) => {
      const x0 = mod.x;
      const x1 = mod.x + mod.w;
      const z0 = mod.z;
      const z1 = mod.z + mod.d;
      const y = mod.h - 0.02; // Just under the beam
      
      // Determine which sides have lights
      let hasBackLight, hasFrontLight, hasLeftLight, hasRightLight;

      if (cfg.layout === '10x12-kit') {
        const s = cfg.kitLightSides || 'front-back';
        if (s === 'none') {
          hasBackLight = hasFrontLight = hasLeftLight = hasRightLight = false;
        } else if (s === 'front-back') {
          hasBackLight = hasFrontLight = true;
          hasLeftLight = hasRightLight = false;
        } else if (s === 'left-right') {
          hasBackLight = hasFrontLight = false;
          hasLeftLight = hasRightLight = true;
        } else {
          hasBackLight = hasFrontLight = hasLeftLight = hasRightLight = true;
        }
      } else {
        // Skip attached side (house wall)
        hasBackLight = cfg.style !== 'attached' || cfg.attachedSide !== 'back';
        hasFrontLight = cfg.style !== 'attached' || cfg.attachedSide !== 'front';
        hasLeftLight = cfg.style !== 'attached' || cfg.attachedSide !== 'left';
        hasRightLight = cfg.style !== 'attached' || cfg.attachedSide !== 'right';
      }

      // Back light strip
      if (hasBackLight) {
        strips.push({
          key: `light-${mod.sectionId}-back`,
          pos: [(x0 + x1) / 2, y, z0],
          args: [x1 - x0 - 0.3, 0.025, 0.05],
          rot: 0
        });
      }

      // Front light strip
      if (hasFrontLight) {
        strips.push({
          key: `light-${mod.sectionId}-front`,
          pos: [(x0 + x1) / 2, y, z1],
          args: [x1 - x0 - 0.3, 0.025, 0.05],
          rot: 0
        });
      }

      // Left light strip
      if (hasLeftLight) {
        strips.push({
          key: `light-${mod.sectionId}-left`,
          pos: [x0, y, (z0 + z1) / 2],
          args: [z1 - z0 - 0.3, 0.025, 0.05],
          rot: Math.PI / 2
        });
      }

      // Right light strip
      if (hasRightLight) {
        strips.push({
          key: `light-${mod.sectionId}-right`,
          pos: [x1, y, (z0 + z1) / 2],
          args: [z1 - z0 - 0.3, 0.025, 0.05],
          rot: Math.PI / 2
        });
      }
    });
    
    return strips;
  }, [modules, cfg]);

  // Shared emissive material - reused for all strips
  const emissiveMaterial = useMemo(() => {
    return (
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={intensity}
        toneMapped={false}
      />
    );
  }, [color, intensity]);

  // Only use emissive materials - no expensive point lights
  // This provides visual glow without performance impact
  return (
    <group>
      {lightStrips.map((strip) => (
        <mesh key={strip.key} position={strip.pos} rotation={[0, strip.rot, 0]}>
          <boxGeometry args={strip.args} />
          {emissiveMaterial}
        </mesh>
      ))}
    </group>
  );
});

const DimLabel = React.memo(({ position, text }) => {
  return (
    <Html position={position} center distanceFactor={9} zIndexRange={[0, 0]}>
      <div
        style={{
          background: 'rgba(20,23,26,0.92)',
          color: '#fff',
          padding: '3px 9px',
          borderRadius: '999px',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '10.5px',
          fontWeight: 600,
          letterSpacing: '0.06em',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {text}
      </div>
    </Html>
  );
});

// Section Highlight Indicator
const SectionHighlight = React.memo(({ mod, isActive }) => {
  if (!isActive) return null;

  const x0 = mod.x,
    x1 = mod.x + mod.w,
    z0 = mod.z,
    z1 = mod.z + mod.d;
  const y = mod.h + BEAM_THICK + 0.15;

  const corners = [
    [x0, y, z0],
    [x1, y, z0],
    [x1, y, z1],
    [x0, y, z1],
  ];

  return (
    <group>
      {corners.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#1a7a4b" emissive="#1a7a4b" emissiveIntensity={1.2} />
        </mesh>
      ))}
    </group>
  );
});

// Single section component
function PergolaSection({ cfg, mod, onFaceClick, stepId }) {
  const sectionId = mod.sectionId;
  const x0 = mod.x,
    x1 = mod.x + mod.w,
    z0 = mod.z,
    z1 = mod.z + mod.d;
  const height = mod.h;
  const section = cfg.sections.find((s) => s.id === sectionId);
  
  const postColor = POST_COLORS.find((c) => c.id === cfg.postColor)?.hex || '#222';
  const louverColor = LOUVER_COLORS.find((c) => c.id === cfg.louverColor)?.hex || '#eee';
  const screenColor = SCREEN_COLORS.find((c) => c.id === cfg.screenColor)?.hex || '#ddd';

  const plan = useMemo(() => postPlan(cfg, sectionId), [cfg, sectionId]);

  const shorterIsZ = section.width <= section.length;
  const runAlong = shorterIsZ ? 'x' : 'z';
  const tilt = ((100 - cfg.louverRotation) / 100) * (Math.PI / 2.2);

  const sets = useMemo(() => louverSetCount(section), [section]);
  const louvers = useMemo(() => {
    const result = [];
    if (sets === 1) {
      result.push({ x0, x1, z0, z1 });
    } else {
      if (shorterIsZ) {
        const span = x1 - x0;
        const segLen = span / sets;
        for (let i = 0; i < sets; i++) result.push({ x0: x0 + i * segLen, x1: x0 + (i + 1) * segLen, z0, z1 });
      } else {
        const span = z1 - z0;
        const segLen = span / sets;
        for (let i = 0; i < sets; i++) result.push({ x0, x1, z0: z0 + i * segLen, z1: z0 + (i + 1) * segLen });
      }
    }
    return result;
  }, [sets, x0, x1, z0, z1, shorterIsZ]);

  // Simple attached check - same for all sections
  const isAttached = cfg.style === 'attached';
  const attachedSide = cfg.attachedSide;
  
  const corners = useMemo(() => {
    const all = [
      { id: 'bl', pos: [x0, z0], sides: ['back', 'left'] },
      { id: 'br', pos: [x1, z0], sides: ['back', 'right'] },
      { id: 'fr', pos: [x1, z1], sides: ['front', 'right'] },
      { id: 'fl', pos: [x0, z1], sides: ['front', 'left'] },
    ];
    // For attached style, remove posts only on the attached side of Section 2
    // Keep junction corners (interior sides) as they support the structure
    return all.filter((c) => {
      if (!isAttached || !attachedSide) return true;
      // Only Section 2 has the attached wall - remove posts there
      if (sectionId !== 'section-2') return true;
      // Remove corners that touch the attached side
      if (c.sides.includes(attachedSide)) return false;
      return true;
    });
  }, [x0, x1, z0, z1, isAttached, attachedSide, sectionId]);

  const extraPosts = useMemo(() => {
    const posts = [];
    for (const post of plan.extraPosts) {
      const positionM = post.position * FT_TO_M;
      if (post.side === 'front') posts.push([x0 + positionM, z1]);
      else if (post.side === 'back') posts.push([x0 + positionM, z0]);
      else if (post.side === 'left') posts.push([x0, z0 + positionM]);
      else posts.push([x1, z0 + positionM]);
    }
    return posts;
  }, [plan, x0, x1, z0, z1]);

  const sides = ['front', 'back', 'left', 'right'];

  const segNodes = [];
  const labels = [];

  sides.forEach((side) => {
    // Check if this is the attached side
    const isThisSideAttached = isAttached && attachedSide === side;
    // Allow clicking on all sides for wall addition
    const segs = segmentsForSide(cfg, sectionId, side);
    const total = segs.length;
    segs.forEach((seg) => {
      // Use actual segment index from the segment object
      const segIdx = seg.idx;
      // Use actual segment boundaries from segmentsForSide (which accounts for post positions)
      // Convert from feet to meters for 3D positioning
      const offset = side === 'front' || side === 'back' ? mod.x : mod.z;
      const a = offset + seg.start * FT_TO_M;
      const b = offset + seg.end * FT_TO_M;


      const scr = cfg.screens.find((x) => x.sectionId === sectionId && x.side === side && x.segIdx === segIdx);
      if (scr) {
        segNodes.push(
          <Screen key={`scr-${sectionId}-${side}-${segIdx}`} mod={mod} side={side} a={a} b={b} height={height} color={screenColor} />
        );
      }

      const w = cfg.walls.find((x) => x.sectionId === sectionId && x.side === side && x.segIdx === segIdx);
      if (w) {
        console.log(`[Wall 3D] ${sectionId}.${side}.${segIdx}: a=${a.toFixed(2)}, b=${b.toFixed(2)}, start=${seg.start}, end=${seg.end}`);
        const wallColor = (WALL_COLORS.find((c) => c.id === w.color) || WALL_COLORS[0]).hex;
        if (!w.gap || w.gap <= 0) {
          segNodes.push(
            <SolidWall key={`wl-${sectionId}-${side}-${segIdx}`} mod={mod} side={side} a={a} b={b} height={height} color={wallColor} />
          );
        } else {
          segNodes.push(
            <SlattedWall key={`wl-${sectionId}-${side}-${segIdx}`} mod={mod} side={side} a={a} b={b} height={height} color={wallColor} gapIn={w.gap} />
          );
        }
      }

      segNodes.push(
        <ClickableSeg
          key={`cs-${sectionId}-${side}-${segIdx}`}
          mod={mod}
          side={side}
          a={a}
          b={b}
          height={height}
          onClick={() => onFaceClick(sectionId, side, segIdx)}
          stepId={stepId}
        />
      );

      if (cfg.showDimensions) {
        const segFt = (b - a) / FT_TO_M;
        let pos;
        const y = height + 0.5;
        if (side === 'front') pos = [(a + b) / 2, y, mod.z + mod.d + 0.4];
        else if (side === 'back') pos = [(a + b) / 2, y, mod.z - 0.4];
        else if (side === 'left') pos = [mod.x - 0.4, y, (a + b) / 2];
        else pos = [mod.x + mod.w + 0.4, y, (a + b) / 2];
        labels.push({ key: `lab-${sectionId}-${side}-${segIdx}`, pos, text: `${segFt.toFixed(1)} ft` });
      }
    });
  });

  const isActive = cfg.activeSection === sectionId;

  return (
    <group>
      {corners.map((c) => (
        <Post key={`p-${sectionId}-${c.id}`} position={c.pos} height={height} color={postColor} />
      ))}
      {extraPosts.map((p, i) => (
        <Post key={`ep-${sectionId}-${i}`} position={p} height={height} color={postColor} />
      ))}

      {/* Segment beams - each louver segment gets its own beam */}
      {louvers.map((seg, i) => (
        <React.Fragment key={`segment-beams-${i}`}>
          {(!isAttached || attachedSide !== 'back') && (
            <Beam position={[(seg.x0 + seg.x1) / 2, height + BEAM_THICK / 2, seg.z0]} args={[seg.x1 - seg.x0, BEAM_THICK, BEAM_THICK]} color={postColor} />
          )}
          {(!isAttached || attachedSide !== 'front') && (
            <Beam position={[(seg.x0 + seg.x1) / 2, height + BEAM_THICK / 2, seg.z1]} args={[seg.x1 - seg.x0, BEAM_THICK, BEAM_THICK]} color={postColor} />
          )}
          {(!isAttached || attachedSide !== 'left') && (
            <Beam position={[seg.x0, height + BEAM_THICK / 2, (seg.z0 + seg.z1) / 2]} args={[BEAM_THICK, BEAM_THICK, seg.z1 - seg.z0]} color={postColor} />
          )}
          {(!isAttached || attachedSide !== 'right') && (
            <Beam position={[seg.x1, height + BEAM_THICK / 2, (seg.z0 + seg.z1) / 2]} args={[BEAM_THICK, BEAM_THICK, seg.z1 - seg.z0]} color={postColor} />
          )}
        </React.Fragment>
      ))}

      {/* Horizontal attach beam on attached side */}
      {isAttached && attachedSide && (
        <HorizontalAttachBeam x0={x0} x1={x1} z0={z0} z1={z1} height={height} side={attachedSide} color={postColor} />
      )}

      {louvers.map((L, i) => (
        <LouverSet key={`lv-${sectionId}-${i}`} {...L} height={height} tilt={tilt} color={louverColor} runAlong={runAlong} />
      ))}

      {segNodes}
      {labels.map((l) => (
        <DimLabel key={l.key} position={l.pos} text={l.text} />
      ))}

      {/* Overall section dimensions at base */}
      {cfg.showDimensions && (
        <>
          <DimLabel
            position={[(x0 + x1) / 2, 0.3, z1 + 0.6]}
            text={`${section.length}′ Length`}
          />
          <DimLabel
            position={[x1 + 0.6, 0.3, (z0 + z1) / 2]}
            text={`${section.width}′ Width`}
          />
          {/* Height dimension on corner post */}
          <DimLabel
            position={[x0 - 0.5, height / 2, z0 - 0.5]}
            text={`${section.height}′ Height`}
          />
        </>
      )}

      <SectionHighlight mod={mod} isActive={isActive && cfg.layout === 'l-shape'} />

      {/* Full-section hover glow for dimensions step */}
      <SectionHoverPlane />
    </group>
  );
}

// Memoized section to prevent re-renders when other sections change
const MemoizedPergolaSection = React.memo(PergolaSection, (prev, next) => {
  // Only re-render if this specific section's config changes
  return (
    prev.mod.sectionId === next.mod.sectionId &&
    prev.mod.x === next.mod.x &&
    prev.mod.z === next.mod.z &&
    prev.mod.w === next.mod.w &&
    prev.mod.d === next.mod.d &&
    prev.mod.h === next.mod.h &&
    prev.cfg.style === next.cfg.style &&
    prev.cfg.attachedSide === next.cfg.attachedSide &&
    prev.cfg.layout === next.cfg.layout &&
    prev.cfg.lShapeConfig === next.cfg.lShapeConfig &&
    prev.cfg.postColor === next.cfg.postColor &&
    prev.cfg.louverColor === next.cfg.louverColor &&
    prev.cfg.louverRotation === next.cfg.louverRotation &&
    prev.cfg.editMode === next.cfg.editMode &&
    prev.cfg.showDimensions === next.cfg.showDimensions &&
    prev.cfg.walls === next.cfg.walls &&
    prev.cfg.screens === next.cfg.screens &&
    JSON.stringify(prev.cfg.sections) === JSON.stringify(next.cfg.sections) &&
    JSON.stringify(prev.cfg.extraPostPositions) === JSON.stringify(next.cfg.extraPostPositions) &&
    prev.stepId === next.stepId
  );
});

export default function PergolaModule({ cfg, modules, onFaceClick, stepId }) {
  // OPTIMIZED: Memoize color lookups
  const lightDef = useMemo(() => LIGHT_COLORS.find((c) => c.id === cfg.lightColor), [cfg.lightColor]);
  const lightHex = useMemo(() => 
    cfg.lightColor === 'rgb' ? '#ff7a4d' : lightDef?.hex || '#ffd28a', 
  [cfg.lightColor, lightDef]);
  
  const postColor = useMemo(() => 
    POST_COLORS.find((c) => c.id === cfg.postColor)?.hex || '#222', 
  [cfg.postColor]);

  // Render house wall(s) ONCE at module level (not per section) to avoid duplication
  const houseWallSegments = useMemo(() => getHouseWallSegments(cfg, modules), [cfg, modules]);
  
  // L-shape junction support posts (extra posts at the connection corners)
  const lshapePosts = useMemo(() => getLShapeSupportPosts(cfg, modules), [cfg, modules]);
  
  // Average height for posts at junction
  const avgHeight = useMemo(
    () => (modules.length > 0 ? modules.reduce((sum, m) => sum + m.h, 0) / modules.length : 0),
    [modules]
  );
  
  // Validate structural support - ensures all exterior corners have posts
  const structuralSupportPosts = useMemo(() => {
    if (cfg.layout !== 'l-shape' || modules.length !== 2) return [];
    
    // Import the validation function
    const { validateStructuralSupport } = require('../../utils/pergolaLayout');
    const requiredPosts = validateStructuralSupport(cfg, modules);
    
    // Filter out posts that are already covered by lshapePosts or section corners
    return requiredPosts.filter((req) => {
      const isCovered = lshapePosts.some((lp) => 
        Math.abs(lp.pos[0] - req.x) < 0.05 && Math.abs(lp.pos[1] - req.z) < 0.05
      );
      return !isCovered;
    }).map((p, i) => ({ pos: [p.x, p.z], id: `structural-${i}` }));
  }, [cfg, modules, lshapePosts]);

  return (
    <group>
      {/* House wall — fixed-size permanent backdrop (doesn't shrink with pergola) */}
      {houseWallSegments.map((seg, i) => (
        <HouseWall
          key={`house-${i}`}
          x0={seg.x0}
          x1={seg.x1}
          z0={seg.z0}
          z1={seg.z1}
          height={seg.height}
          side={seg.side}
          fixed={seg.fixed}
        />
      ))}

      {modules.map((mod) => (
        <MemoizedPergolaSection key={mod.sectionId} cfg={cfg} mod={mod} onFaceClick={onFaceClick} stepId={stepId} />
      ))}

      {/* L-Shape support posts at junction */}
      {lshapePosts.map((p) => (
        <Post key={`lshape-${p.id}`} position={p.pos} height={avgHeight} color={postColor} />
      ))}
      
      {/* Additional structural support posts for unsupported corners */}
      {structuralSupportPosts.map((p) => (
        <Post key={`structural-${p.id}`} position={p.pos} height={avgHeight} color={postColor} />
      ))}

      {cfg.lightColor !== 'none' && <PerimeterLightStrip modules={modules} color={lightHex} intensity={1.6} cfg={cfg} />}
    </group>
  );
}
