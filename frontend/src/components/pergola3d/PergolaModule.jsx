import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { POST_COLORS, LOUVER_COLORS, SCREEN_COLORS, WALL_COLORS, LIGHT_COLORS } from '../../data/catalog';
import { postPlan, segmentsForSide, louverSetCount } from '../../utils/pergolaRules';
import { FT_TO_M, getPerimeterPath, getHouseWallSegments, getLShapeSupportPosts, isSideFullyInterior } from '../../utils/pergolaLayout';

const POST_THICK = 0.22;
const BEAM_THICK = 0.22;
const LOUVER_THICK = 0.035;
const LOUVER_DEPTH = 0.26;
const LOUVER_SPACING = 0.27;

// Matte materials shared
const aluminumMaterial = (color) => (
  <meshStandardMaterial 
    color={color} 
    metalness={0.2} 
    roughness={0.7}
    clearcoat={0.15}
    clearcoatRoughness={0.75}
  />
);

// Heater color from addOns config (white, black, or default)
function addOnsHeaterColor(cfg) {
  const color = cfg.addOns?.heaterColor;
  if (color === 'white') return '#e8e8e8';
  if (color === 'black') return '#1a1a1a';
  return '#222';
}

// Memoized components for performance with proper cleanup
const Post = React.memo(({ position, height, color }) => {
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

  // Post extends to top of beam structure
  const totalHeight = height + BEAM_THICK;

  return (
    <mesh ref={meshRef} position={[position[0], totalHeight / 2, position[1]]} castShadow receiveShadow>
      <boxGeometry args={[POST_THICK, totalHeight, POST_THICK]} />
      {aluminumMaterial(color)}
    </mesh>
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

  return (
    <mesh ref={meshRef} position={position} castShadow receiveShadow>
      <boxGeometry args={args} />
      {aluminumMaterial(color)}
    </mesh>
  );
});

// Wall-mounted patio heater bar mounted under top beam, facing inward
const WallHeater = React.memo(({ side, x0, x1, z0, z1, height, color = '#222', offset = 0 }) => {
  const HEATER_W = 0.85;
  const HEATER_H = 0.18;
  const HEATER_D = 0.10;
  const MOUNT_Y = height - 0.15;

  // Center of side with optional offset for multiple heaters
  let cx, cz;
  if (side === 'front' || side === 'back') {
    cx = (x0 + x1) / 2 + offset;
    cz = side === 'front' ? z1 : z0;
  } else {
    cx = side === 'left' ? x0 : x1;
    cz = (z0 + z1) / 2 + offset;
  }

  let pos, rot;
  if (side === 'front') {
    pos = [cx, MOUNT_Y, cz - HEATER_D / 2 - 0.02];
    rot = [0, Math.PI, 0];
  } else if (side === 'back') {
    pos = [cx, MOUNT_Y, cz + HEATER_D / 2 + 0.02];
    rot = [0, 0, 0];
  } else if (side === 'left') {
    pos = [cx + HEATER_D / 2 + 0.02, MOUNT_Y, cz];
    rot = [0, Math.PI / 2, 0];
  } else {
    pos = [cx - HEATER_D / 2 - 0.02, MOUNT_Y, cz];
    rot = [0, -Math.PI / 2, 0];
  }

  return (
    <group position={pos} rotation={rot}>
      {/* Main heater body */}
      <mesh castShadow>
        <boxGeometry args={[HEATER_W, HEATER_H, HEATER_D]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Glowing element strip */}
      <mesh position={[0, 0, HEATER_D / 2 + 0.001]}>
        <planeGeometry args={[HEATER_W - 0.08, HEATER_H - 0.05]} />
        <meshStandardMaterial color="#ff7a33" emissive="#ff5a1a" emissiveIntensity={1.4} roughness={0.8} />
      </mesh>
      {/* Mount brackets — longer to reach up to beam */}
      <mesh position={[-HEATER_W / 2 + 0.09, 0.065, -HEATER_D / 2 - 0.04]}>
        <boxGeometry args={[0.035, 0.22, 0.14]} />
        <meshStandardMaterial color="#888" roughness={0.5} metalness={0.7} />
      </mesh>
      <mesh position={[HEATER_W / 2 - 0.09, 0.065, -HEATER_D / 2 - 0.04]}>
        <boxGeometry args={[0.035, 0.22, 0.14]} />
        <meshStandardMaterial color="#888" roughness={0.5} metalness={0.7} />
      </mesh>
    </group>
  );
});

// Green glow overlay on a post — fades over 2 seconds when outlet is added
const PostGlow = React.memo(({ position, height }) => {
  const meshRef = useRef();
  const startTime = useRef(Date.now());

  useFrame(() => {
    const elapsed = (Date.now() - startTime.current) / 1000;
    const progress = Math.min(elapsed / 2, 1);
    const opacity = 1 - progress;
    if (meshRef.current) {
      meshRef.current.material.opacity = opacity * 0.6;
      meshRef.current.material.transparent = true;
      meshRef.current.visible = progress < 1;
    }
  });

  return (
    <mesh ref={meshRef} position={[position[0], height / 2, position[1]]}>
      <boxGeometry args={[POST_THICK + 0.02, height + 0.02, POST_THICK + 0.02]} />
      <meshBasicMaterial color="#22c55e" transparent opacity={0.6} depthWrite={false} />
    </mesh>
  );
});

// Green glow overlay on the top beam where heater is mounted — thick & bright so it's visible from any angle
const BeamGlow = React.memo(({ position, args }) => {
  const boxRef = useRef();
  const startTime = useRef(Date.now());

  useFrame(() => {
    const elapsed = (Date.now() - startTime.current) / 1000;
    const progress = Math.min(elapsed / 2.2, 1);
    const ease = 1 - progress;
    if (boxRef.current) {
      boxRef.current.material.opacity = ease * 0.75;
    }
  });

  const [len, h, d] = args;
  const glowArgs = [len + 0.24, h + 0.24, d + 0.24];

  return (
    <mesh ref={boxRef} position={position}>
      <boxGeometry args={glowArgs} />
      <meshBasicMaterial color="#4ade80" transparent opacity={0.75} depthWrite={false} />
    </mesh>
  );
});

// Outlet on a post (~2ft / 0.6m above ground), facing inward toward pergola center
const PostOutlet = React.memo(({ position, height, inwardDir }) => {
  const OUTLET_Y = 0.6; // 2 ft in meters
  const W = 0.14;  // width  (14cm)
  const H = 0.16;  // height (16cm)
  const D = 0.025; // protrusion depth
  const POST_R = 0.08; // post half-thickness

  // Place on post surface facing inward
  const ox = position[0] + inwardDir[0] * POST_R;
  const oz = position[1] + inwardDir[1] * POST_R;
  const ry = Math.atan2(inwardDir[0], inwardDir[1]); // rotate to face inward

  return (
    <group position={[ox, OUTLET_Y, oz]} rotation={[0, ry, 0]}>
      {/* Amber warning border ring — highly visible against any post */}
      <mesh position={[0, 0, -0.002]} castShadow receiveShadow>
        <boxGeometry args={[W + 0.015, H + 0.015, D * 0.4]} />
        <meshStandardMaterial color="#f5a623" roughness={0.5} metalness={0.1} />
      </mesh>
      {/* White faceplate */}
      <mesh position={[0, 0, D / 2]} castShadow receiveShadow>
        <boxGeometry args={[W, H, D]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.05} />
      </mesh>
      {/* Inner dark socket ring */}
      <mesh position={[0, 0, D + 0.002]}>
        <circleGeometry args={[W * 0.22, 24]} />
        <meshStandardMaterial color="#222" roughness={0.7} />
      </mesh>
      {/* Green indicator dot */}
      <mesh position={[W * 0.28, H * 0.28, D + 0.004]}>
        <circleGeometry args={[0.009, 12]} />
        <meshStandardMaterial color="#1a7a4b" emissive="#1a7a4b" emissiveIntensity={0.6} />
      </mesh>
      {/* Screws in corners */}
      {[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sy], i) => (
        <mesh key={i} position={[sx * W * 0.38, sy * H * 0.38, D + 0.003]}>
          <circleGeometry args={[0.005, 8]} />
          <meshStandardMaterial color="#bbb" roughness={0.4} metalness={0.6} />
        </mesh>
      ))}
      {/* Mount box behind (sticks into post) */}
      <mesh position={[0, 0, -POST_R * 0.55]} receiveShadow>
        <boxGeometry args={[W * 0.85, H * 0.85, POST_R]} />
        <meshStandardMaterial color="#d8d8d0" roughness={0.5} metalness={0.1} />
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
    
    // Matte aluminum material
    const mat = (
      <meshStandardMaterial 
        color={color} 
        metalness={0.15} 
        roughness={0.75}
        clearcoat={0.1}
        clearcoatRoughness={0.8}
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
    return <Beam position={[(x0 + x1) / 2, height + BEAM_THICK / 2, z1]} args={[x1 - x0 + 0.02, BEAM_THICK, BEAM_THICK]} color={color} />;
  }
  if (side === 'back') {
    return <Beam position={[(x0 + x1) / 2, height + BEAM_THICK / 2, z0]} args={[x1 - x0 + 0.02, BEAM_THICK, BEAM_THICK]} color={color} />;
  }
  if (side === 'left') {
    return <Beam position={[x0, height + BEAM_THICK / 2, (z0 + z1) / 2]} args={[BEAM_THICK, BEAM_THICK, z1 - z0 + 0.02]} color={color} />;
  }
  return <Beam position={[x1, height + BEAM_THICK / 2, (z0 + z1) / 2]} args={[BEAM_THICK, BEAM_THICK, z1 - z0 + 0.02]} color={color} />;
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

// Helpers for fabric texture generation
function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
}

// Shared weave settings
const TEX_SIZE = 1024;
const TPI = 24;
const CELL = TEX_SIZE / TPI;
const THREAD_W = CELL * 0.80;   // very dense weave, mostly opaque
const GAP = CELL - THREAD_W;
const HALF_GAP = GAP / 2;

// Color map: realistic woven fabric with gradients, shadows, highlights
const screenMeshTexture = (() => {
  const canvas = document.createElement('canvas');
  canvas.width = TEX_SIZE;
  canvas.height = TEX_SIZE;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);

  function drawThread(x, y, w, h, isVertical) {
    // Shadow beneath thread
    ctx.fillStyle = '#0a0a0a';
    if (isVertical) {
      ctx.fillRect(x + 1, y + 2, w, h);
    } else {
      ctx.fillRect(x + 2, y + 1, w, h);
    }

    // Main thread body with rounded gradient
    const grad = ctx.createLinearGradient(
      isVertical ? x : x, isVertical ? y : y,
      isVertical ? x + w : x + w, isVertical ? y + h : y + h
    );
    grad.addColorStop(0, '#b8a898');
    grad.addColorStop(0.35, '#e8ddd0');
    grad.addColorStop(0.5, '#f5ede6');
    grad.addColorStop(0.65, '#e0d4c6');
    grad.addColorStop(1, '#a89888');

    ctx.fillStyle = grad;
    roundRect(ctx, x, y, w, h, w * 0.25);
    ctx.fill();

    // Highlight strip for cylindrical thread look
    const hlGrad = ctx.createLinearGradient(
      isVertical ? x + w * 0.25 : x + w * 0.2,
      isVertical ? y + h * 0.1 : y + h * 0.25,
      isVertical ? x + w * 0.75 : x + w * 0.8,
      isVertical ? y + h * 0.9 : y + h * 0.75
    );
    hlGrad.addColorStop(0, 'rgba(255,255,255,0)');
    hlGrad.addColorStop(0.5, 'rgba(255,255,255,0.35)');
    hlGrad.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.fillStyle = hlGrad;
    roundRect(ctx, x + w * 0.15, y + h * 0.1, w * 0.7, h * 0.8, w * 0.15);
    ctx.fill();
  }

  // Horizontal threads
  for (let y = 0; y < TEX_SIZE; y += CELL) {
    for (let x = 0; x < TEX_SIZE; x += CELL) {
      drawThread(x + HALF_GAP, y + HALF_GAP, THREAD_W, THREAD_W, false);
    }
  }
  // Vertical threads on top with weave shift
  for (let x = 0; x < TEX_SIZE; x += CELL) {
    for (let y = 0; y < TEX_SIZE; y += CELL) {
      const shift = (Math.floor(x / CELL) % 2 === 0) ? 0 : CELL * 0.1;
      drawThread(x + HALF_GAP, y + HALF_GAP + shift, THREAD_W, THREAD_W, true);
    }
  }

  // Subtle noise
  const imageData = ctx.getImageData(0, 0, TEX_SIZE, TEX_SIZE);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] > 50) {
      const n = (Math.random() - 0.5) * 12;
      d[i]     = Math.min(255, Math.max(0, d[i] + n));
      d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n));
      d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n));
    }
  }
  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 12);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  return texture;
})();

// Alpha map: binary black/white mask for clean opaque threads
const screenAlphaTexture = (() => {
  const canvas = document.createElement('canvas');
  canvas.width = TEX_SIZE;
  canvas.height = TEX_SIZE;
  const ctx = canvas.getContext('2d');

  // Pure black = fully transparent (holes)
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);

  // Pure white = fully opaque (threads)
  ctx.fillStyle = '#ffffff';

  function drawWhiteThread(x, y, w, h, isVertical) {
    roundRect(ctx, x, y, w, h, w * 0.2);
    ctx.fill();
  }

  // Horizontal threads
  for (let y = 0; y < TEX_SIZE; y += CELL) {
    for (let x = 0; x < TEX_SIZE; x += CELL) {
      drawWhiteThread(x + HALF_GAP, y + HALF_GAP, THREAD_W, THREAD_W, false);
    }
  }
  // Vertical threads on top with weave shift
  for (let x = 0; x < TEX_SIZE; x += CELL) {
    for (let y = 0; y < TEX_SIZE; y += CELL) {
      const shift = (Math.floor(x / CELL) % 2 === 0) ? 0 : CELL * 0.1;
      drawWhiteThread(x + HALF_GAP, y + HALF_GAP + shift, THREAD_W, THREAD_W, true);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 12);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  return texture;
})();

const Screen = React.memo(({ mod, side, a, b, height, color }) => {
  const fullHeight = height + BEAM_THICK;

  // Bottom rail + slat height
  const railH = 0.06;
  const slatH = 0.025;
  const bottomSolidH = railH + slatH;

  // Fabric starts above the slat so threads don't show in slat area
  const fabricHeight = fullHeight - bottomSolidH;
  const fabricY = bottomSolidH + fabricHeight / 2;

  let fabricPos, fabricArgs;
  if (side === 'front' || side === 'back') {
    fabricPos = [(a + b) / 2, fabricY, mod.z + mod.d];
    if (side === 'back') fabricPos[2] = mod.z;
    fabricArgs = [b - a - 0.05, fabricHeight, 0.08];
  } else {
    fabricPos = [mod.x, fabricY, (a + b) / 2];
    if (side === 'right') fabricPos[0] = mod.x + mod.w;
    fabricArgs = [0.08, fabricHeight, b - a - 0.05];
  }

  // Bottom rail strip
  const railD = 0.055;
  let railPos, railArgs;
  if (side === 'front' || side === 'back') {
    railPos = [fabricPos[0], railH / 2, fabricPos[2]];
    railArgs = [fabricArgs[0], railH, railD];
  } else {
    railPos = [fabricPos[0], railH / 2, fabricPos[2]];
    railArgs = [railD, railH, fabricArgs[2]];
  }

  // Small aluminum slat at bottom of screen fabric
  const slatD = 0.04;
  let slatPos, slatArgs;
  if (side === 'front' || side === 'back') {
    slatPos = [fabricPos[0], railH + slatH / 2, fabricPos[2]];
    slatArgs = [fabricArgs[0], slatH, slatD];
  } else {
    slatPos = [fabricPos[0], railH + slatH / 2, fabricPos[2]];
    slatArgs = [slatD, slatH, fabricArgs[2]];
  }

  return (
    <group>
      {/* Fabric panel — starts above the slat so threads don't overlap slat area */}
      <mesh position={fabricPos}>
        <boxGeometry args={fabricArgs} />
        <meshStandardMaterial
          map={screenMeshTexture}
          alphaMap={screenAlphaTexture}
          color={color || '#2e2e2e'}
          transparent
          alphaTest={0.5}
          side={THREE.DoubleSide}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>
      {/* Bottom rail matching screen color */}
      <mesh position={railPos} castShadow>
        <boxGeometry args={railArgs} />
        <meshStandardMaterial color={color || '#ddd'} roughness={0.5} metalness={0.5} />
      </mesh>
      {/* Bottom slat matching screen color */}
      <mesh position={slatPos} castShadow>
        <boxGeometry args={slatArgs} />
        <meshStandardMaterial color={color || '#ddd'} roughness={0.45} metalness={0.55} />
      </mesh>
    </group>
  );
});

// Procedural slat plank texture — solid wall that looks like continuous slats with no gaps
const slatPlankTexture = (() => {
  const W = 512;
  const H = 512;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Base wood color
  ctx.fillStyle = '#d4b896';
  ctx.fillRect(0, 0, W, H);

  // Horizontal plank seams (darker lines)
  const plankCount = 16;
  const plankH = H / plankCount;
  for (let i = 0; i <= plankCount; i++) {
    const y = i * plankH;
    ctx.fillStyle = 'rgba(80, 55, 30, 0.25)';
    ctx.fillRect(0, y - 1, W, 2);
  }

  // Subtle wood grain lines
  for (let i = 0; i < 120; i++) {
    const y = Math.random() * H;
    ctx.strokeStyle = `rgba(${100 + Math.random() * 60}, ${70 + Math.random() * 40}, ${40 + Math.random() * 30}, ${0.05 + Math.random() * 0.1})`;
    ctx.lineWidth = 0.5 + Math.random() * 1.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    let cx = 0;
    while (cx < W) {
      cx += 10 + Math.random() * 30;
      ctx.lineTo(cx, y + (Math.random() - 0.5) * 4);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
})();

const SolidWall = React.memo(({ mod, side, a, b, height, color }) => {
  // Zero-gap slatted wall — slats fill full height from bottom (y=0) to top beam with no gaps
  const fullHeight = height + BEAM_THICK;
  const targetSlatH = 0.15; // ~15cm target slat height
  const slatDepth = 0.06;
  const seamGap = 0.002; // 2mm shadow gap between slats
  const count = Math.max(2, Math.round(fullHeight / targetSlatH));
  // total = count * slatH + (count - 1) * seamGap = fullHeight
  const slatH = (fullHeight - (count - 1) * seamGap) / count;

  const slats = useMemo(() => {
    const slatData = [];
    for (let i = 0; i < count; i++) {
      const y = slatH / 2 + i * (slatH + seamGap); // first slat bottom edge at 0
      let position, scale;
      if (side === 'front') {
        position = [(a + b) / 2, y, mod.z + mod.d];
        scale = [b - a - 0.05, slatH, slatDepth];
      } else if (side === 'back') {
        position = [(a + b) / 2, y, mod.z];
        scale = [b - a - 0.05, slatH, slatDepth];
      } else if (side === 'left') {
        position = [mod.x, y, (a + b) / 2];
        scale = [slatDepth, slatH, b - a - 0.05];
      } else {
        position = [mod.x + mod.w, y, (a + b) / 2];
        scale = [slatDepth, slatH, b - a - 0.05];
      }
      slatData.push({ position, scale, key: i });
    }
    return slatData;
  }, [count, slatH, seamGap, side, a, b, mod]);

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

const SlattedWall = React.memo(({ mod, side, a, b, height, color, gapIn }) => {
  const SLAT_H_FT = 0.5;
  const gapFt = gapIn / 12;
  const slatH = SLAT_H_FT * FT_TO_M;
  const gap = gapFt * FT_TO_M;
  const unit = slatH + gap;
  // Full coverage from ground to beam top (no gap)
  const fullHeight = height + BEAM_THICK;
  const usable = fullHeight - 0.01;
  const rawCount = Math.max(2, Math.floor(usable / unit));
  
  const count = rawCount;
  
  const totalSpan = count * slatH + (count - 1) * gap;
  const startY = slatH / 2 + 0.005; // first slat bottom edge near ground
  
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

// Shared animated light material hook — used by all light strips including junctions
function useAnimatedLightMaterial(color, intensity, cfg) {
  const { invalidate } = useThree();

  const mat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: intensity,
      toneMapped: false,
    });
  }, [color, intensity]);

  const isRgbRef = useRef(false);
  const tRef = useRef(0);

  useEffect(() => {
    isRgbRef.current = cfg.lightColor === 'rgb';
    if (!isRgbRef.current) {
      tRef.current = 0;
      mat.color.set(color);
      mat.emissive.set(color);
      mat.emissiveIntensity = intensity;
    }
  }, [cfg.lightColor, color, intensity, mat]);

  useFrame((_, delta) => {
    if (!isRgbRef.current) return;
    tRef.current += delta;
    const t = tRef.current;

    if (t < 1) {
      mat.color.setRGB(1 - t, t, 0);
    } else if (t < 2) {
      const p = t - 1;
      mat.color.setRGB(0, 1 - p, p);
    } else if (t < 3) {
      const p = t - 2;
      mat.color.setRGB(p, 0, 1 - p);
    } else {
      mat.color.setRGB(1, 0, 0);
    }
    mat.emissive.copy(mat.color);
    invalidate();
  });

  return mat;
}

// LED strip lights under beams — visible glowing strips with floor reflection
const PerimeterLightStrip = React.memo(({ modules, mat, cfg }) => {
  const lightStrips = useMemo(() => {
    if (!modules.length) return [];

    const strips = [];

    modules.forEach((mod) => {
      const x0 = mod.x, x1 = mod.x + mod.w;
      const z0 = mod.z, z1 = mod.z + mod.d;
      const y = mod.h + BEAM_THICK - 0.09; // just below louvers, on beam underside
      const inset = 0.03; // nudge slightly inside so strip faces interior

      let hasBack, hasFront, hasLeft, hasRight;
      if (cfg.layout === '10x12-kit') {
        const s = cfg.kitLightSides || 'front-back';
        if (s === 'none') { hasBack = hasFront = hasLeft = hasRight = false; }
        else if (s === 'front-back') { hasBack = hasFront = true; hasLeft = hasRight = false; }
        else if (s === 'left-right') { hasBack = hasFront = false; hasLeft = hasRight = true; }
        else { hasBack = hasFront = hasLeft = hasRight = true; }
      } else {
        hasBack = cfg.style !== 'attached' || cfg.attachedSide !== 'back';
        hasFront = cfg.style !== 'attached' || cfg.attachedSide !== 'front';
        hasLeft = cfg.style !== 'attached' || cfg.attachedSide !== 'left';
        hasRight = cfg.style !== 'attached' || cfg.attachedSide !== 'right';
      }

      if (hasBack) strips.push({ key: `light-${mod.sectionId}-back`, pos: [(x0 + x1) / 2, y, z0 + BEAM_THICK / 2 + inset], len: x1 - x0 - BEAM_THICK, rot: 0, target: [(x0 + x1) / 2, 0, z0 + BEAM_THICK / 2 + inset] });
      if (hasFront) strips.push({ key: `light-${mod.sectionId}-front`, pos: [(x0 + x1) / 2, y, z1 - BEAM_THICK / 2 - inset], len: x1 - x0 - BEAM_THICK, rot: 0, target: [(x0 + x1) / 2, 0, z1 - BEAM_THICK / 2 - inset] });
      if (hasLeft) strips.push({ key: `light-${mod.sectionId}-left`, pos: [x0 + BEAM_THICK / 2 + inset, y, (z0 + z1) / 2], len: z1 - z0 - BEAM_THICK, rot: Math.PI / 2, target: [x0 + BEAM_THICK / 2 + inset, 0, (z0 + z1) / 2] });
      if (hasRight) strips.push({ key: `light-${mod.sectionId}-right`, pos: [x1 - BEAM_THICK / 2 - inset, y, (z0 + z1) / 2], len: z1 - z0 - BEAM_THICK, rot: Math.PI / 2, target: [x1 - BEAM_THICK / 2 - inset, 0, (z0 + z1) / 2] });
    });

    return strips;
  }, [modules, cfg]);

  return (
    <group>
      {lightStrips.map((strip) => (
        <group key={strip.key}>
          {/* Glowing LED strip body */}
          <mesh position={strip.pos} rotation={[0, strip.rot, 0]}>
            <boxGeometry args={[strip.len, 0.05, 0.12]} />
            <primitive object={mat} attach="material" />
          </mesh>
          {/* Clear diffuser cap */}
          <mesh position={[strip.pos[0], strip.pos[1] - 0.03, strip.pos[2]]} rotation={[0, strip.rot, 0]}>
            <boxGeometry args={[strip.len, 0.012, 0.125]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.35} roughness={0.1} />
          </mesh>
        </group>
      ))}
    </group>
  );
});

const DimLabel = React.memo(({ position, text }) => {
  return (
    <Html position={position} center distanceFactor={9} zIndexRange={[0, 0]}>
      <div
        style={{
          background: 'rgba(255,255,255,0.9)',
          color: '#222',
          padding: '1px 6px',
          borderRadius: '3px',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '10px',
          fontWeight: 500,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        }}
      >
        {text}
      </div>
    </Html>
  );
});

const DimLine = React.memo(({ start, end, text, extA, extB, color = '#d32f2f' }) => {
  const dimLineRef = useRef();
  const extALineRef = useRef();
  const extBLineRef = useRef();
  const startArrowRef = useRef();
  const endArrowRef = useRef();

  const dir = useMemo(() => {
    const d = new THREE.Vector3(end[0] - start[0], end[1] - start[1], end[2] - start[2]);
    return d.normalize();
  }, [start, end]);

  const mid = useMemo(() => [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2, (start[2] + end[2]) / 2], [start, end]);

  const qStart = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    return new THREE.Quaternion().setFromUnitVectors(up, dir);
  }, [dir]);

  const qEnd = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    return new THREE.Quaternion().setFromUnitVectors(up, dir.clone().negate());
  }, [dir]);

  // Imperatively update geometry so lines always follow current coordinates
  useEffect(() => {
    if (dimLineRef.current) {
      const pos = dimLineRef.current.geometry.attributes.position;
      pos.setXYZ(0, start[0], start[1], start[2]);
      pos.setXYZ(1, end[0], end[1], end[2]);
      pos.needsUpdate = true;
    }
    if (extALineRef.current && extA) {
      const pos = extALineRef.current.geometry.attributes.position;
      pos.setXYZ(0, extA[0], extA[1], extA[2]);
      pos.setXYZ(1, start[0], start[1], start[2]);
      pos.needsUpdate = true;
      extALineRef.current.computeLineDistances();
    }
    if (extBLineRef.current && extB) {
      const pos = extBLineRef.current.geometry.attributes.position;
      pos.setXYZ(0, extB[0], extB[1], extB[2]);
      pos.setXYZ(1, end[0], end[1], end[2]);
      pos.needsUpdate = true;
      extBLineRef.current.computeLineDistances();
    }
    if (startArrowRef.current) {
      startArrowRef.current.position.set(start[0], start[1], start[2]);
      startArrowRef.current.quaternion.set(qStart.x, qStart.y, qStart.z, qStart.w);
    }
    if (endArrowRef.current) {
      endArrowRef.current.position.set(end[0], end[1], end[2]);
      endArrowRef.current.quaternion.set(qEnd.x, qEnd.y, qEnd.z, qEnd.w);
    }
  }, [start, end, extA, extB, qStart, qEnd]);

  return (
    <group>
      <line ref={dimLineRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={2} array={new Float32Array([...start, ...end])} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial color={color} linewidth={2} />
      </line>
      {extA && (
        <line ref={extALineRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={2} array={new Float32Array([...extA, ...start])} itemSize={3} />
          </bufferGeometry>
          <lineDashedMaterial color="#666" dashSize={0.04} gapSize={0.03} />
        </line>
      )}
      {extB && (
        <line ref={extBLineRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={2} array={new Float32Array([...extB, ...end])} itemSize={3} />
          </bufferGeometry>
          <lineDashedMaterial color="#666" dashSize={0.04} gapSize={0.03} />
        </line>
      )}
      <group ref={startArrowRef} position={start} quaternion={[qStart.x, qStart.y, qStart.z, qStart.w]}>
        <mesh>
          <coneGeometry args={[0.02, 0.06, 6]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </group>
      <group ref={endArrowRef} position={end} quaternion={[qEnd.x, qEnd.y, qEnd.z, qEnd.w]}>
        <mesh>
          <coneGeometry args={[0.02, 0.06, 6]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </group>
      <DimLabel position={mid} text={text} />
    </group>
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

  // Track newly added heaters/outlets for flash animation
  const prevHeaterKeysRef = useRef(new Set());
  const prevOutletKeysRef = useRef(new Set());
  const mountedRef = useRef(false);
  const [activeFlashes, setActiveFlashes] = useState([]);

  useEffect(() => {
    const heaters = cfg.heaters || [];
    const outlets = cfg.outlets || [];

    const heaterKey = (h) => `${h.sectionId}-${h.side}-${h.index ?? 0}`;
    const outletKey = (o) => `${o.sectionId}-${o.postKey}`;

    const currentHKeys = new Set(heaters.map(heaterKey));
    const currentOKeys = new Set(outlets.map(outletKey));

    if (!mountedRef.current) {
      mountedRef.current = true;
      prevHeaterKeysRef.current = currentHKeys;
      prevOutletKeysRef.current = currentOKeys;
      return;
    }

    const prevHKeys = prevHeaterKeysRef.current;
    const prevOKeys = prevOutletKeysRef.current;

    const newGlows = [];

    const cornerDefs = [
      { id: 'bl', pos: [x0, z0], sides: ['back', 'left'] },
      { id: 'br', pos: [x1, z0], sides: ['back', 'right'] },
      { id: 'fr', pos: [x1, z1], sides: ['front', 'right'] },
      { id: 'fl', pos: [x0, z1], sides: ['front', 'left'] },
    ];

    // Heaters: glow the top beam on that side
    for (const h of heaters) {
      if (h.sectionId !== sectionId) continue;
      const key = heaterKey(h);
      if (!prevHKeys.has(key)) {
        let bPos, bArgs;
        if (h.side === 'front') {
          bPos = [(x0 + x1) / 2, height + BEAM_THICK / 2, z1];
          bArgs = [x1 - x0, BEAM_THICK, BEAM_THICK];
        } else if (h.side === 'back') {
          bPos = [(x0 + x1) / 2, height + BEAM_THICK / 2, z0];
          bArgs = [x1 - x0, BEAM_THICK, BEAM_THICK];
        } else if (h.side === 'left') {
          bPos = [x0, height + BEAM_THICK / 2, (z0 + z1) / 2];
          bArgs = [BEAM_THICK, BEAM_THICK, z1 - z0];
        } else {
          bPos = [x1, height + BEAM_THICK / 2, (z0 + z1) / 2];
          bArgs = [BEAM_THICK, BEAM_THICK, z1 - z0];
        }
        newGlows.push({ id: `glow-h-${key}`, type: 'beam', pos: bPos, args: bArgs });
      }
    }

    // Outlets: glow the specific post
    const plan = postPlan(cfg, sectionId);
    for (const o of outlets) {
      if (o.sectionId !== sectionId) continue;
      const key = outletKey(o);
      if (!prevOKeys.has(key)) {
        let postPos = null;
        const cornerMatch = cornerDefs.find((c) => `${sectionId}-corner-${c.id}` === o.postKey);
        if (cornerMatch) {
          postPos = cornerMatch.pos;
        } else {
          const extraMatch = plan.extraPosts.find((p) => p.positionKey === o.postKey);
          if (extraMatch) {
            const pm = extraMatch.position * FT_TO_M;
            if (extraMatch.side === 'front') postPos = [x0 + pm, z1];
            else if (extraMatch.side === 'back') postPos = [x0 + pm, z0];
            else if (extraMatch.side === 'left') postPos = [x0, z0 + pm];
            else postPos = [x1, z0 + pm];
          }
        }
        if (postPos) {
          newGlows.push({ id: `glow-o-${key}`, type: 'post', pos: postPos });
        }
      }
    }

    if (newGlows.length > 0) {
      setActiveFlashes((prev) => [...prev, ...newGlows]);
      setTimeout(() => {
        setActiveFlashes((prev) => prev.filter((f) => !newGlows.some((ng) => ng.id === f.id)));
      }, 2200);
    }

    prevHeaterKeysRef.current = currentHKeys;
    prevOutletKeysRef.current = currentOKeys;
  }, [cfg, cfg.heaters, cfg.outlets, sectionId, x0, x1, z0, z1, height]);
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
  
  const removedSet = useMemo(() => new Set(cfg.removedPostKeys || []), [cfg.removedPostKeys]);

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
    }).filter((c) => !removedSet.has(`${sectionId}-corner-${c.id}`));
  }, [x0, x1, z0, z1, isAttached, attachedSide, sectionId, removedSet]);

  const extraPosts = useMemo(() => {
    const posts = [];
    for (const post of plan.extraPosts) {
      const positionM = post.position * FT_TO_M;
      let px, pz;
      if (post.side === 'front') { px = x0 + positionM; pz = z1; }
      else if (post.side === 'back') { px = x0 + positionM; pz = z0; }
      else if (post.side === 'left') { px = x0; pz = z0 + positionM; }
      else { px = x1; pz = z0 + positionM; }
      // Only keep posts inside current pergola bounds
      if (px >= x0 - 0.01 && px <= x1 + 0.01 && pz >= z0 - 0.01 && pz <= z1 + 0.01) {
        posts.push([px, pz]);
      }
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
        const spanFt = seg.end - seg.start;
        const yDim = height + 0.35;
        const yBeam = height;
        let pStart, pEnd, eA, eB;
        if (side === 'front') {
          const z = mod.z + mod.d + 0.35;
          pStart = [a, yDim, z]; pEnd = [b, yDim, z];
          eA = [a, yBeam, z]; eB = [b, yBeam, z];
        } else if (side === 'back') {
          const z = mod.z - 0.35;
          pStart = [a, yDim, z]; pEnd = [b, yDim, z];
          eA = [a, yBeam, z]; eB = [b, yBeam, z];
        } else if (side === 'left') {
          const x = mod.x - 0.35;
          pStart = [x, yDim, a]; pEnd = [x, yDim, b];
          eA = [x, yBeam, a]; eB = [x, yBeam, b];
        } else {
          const x = mod.x + mod.w + 0.35;
          pStart = [x, yDim, a]; pEnd = [x, yDim, b];
          eA = [x, yBeam, a]; eB = [x, yBeam, b];
        }
        labels.push({
          key: `post-${sectionId}-${side}-${segIdx}`,
          isLine: true,
          start: pStart, end: pEnd, extA: eA, extB: eB,
          text: `${spanFt.toFixed(1)} ft`,
          color: '#1565c0',
        });
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
            <Beam position={[(seg.x0 + seg.x1) / 2, height + BEAM_THICK / 2, seg.z0]} args={[seg.x1 - seg.x0 + 0.02, BEAM_THICK, BEAM_THICK]} color={postColor} />
          )}
          {(!isAttached || attachedSide !== 'front') && (
            <Beam position={[(seg.x0 + seg.x1) / 2, height + BEAM_THICK / 2, seg.z1]} args={[seg.x1 - seg.x0 + 0.02, BEAM_THICK, BEAM_THICK]} color={postColor} />
          )}
          {(!isAttached || attachedSide !== 'left') && (
            <Beam position={[seg.x0, height + BEAM_THICK / 2, (seg.z0 + seg.z1) / 2]} args={[BEAM_THICK, BEAM_THICK, seg.z1 - seg.z0 + 0.02]} color={postColor} />
          )}
          {(!isAttached || attachedSide !== 'right') && (
            <Beam position={[seg.x1, height + BEAM_THICK / 2, (seg.z0 + seg.z1) / 2]} args={[BEAM_THICK, BEAM_THICK, seg.z1 - seg.z0 + 0.02]} color={postColor} />
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
      {labels.map((l) =>
        l.isLine ? (
          <DimLine
            key={l.key}
            start={l.start}
            end={l.end}
            text={l.text}
            extA={l.extA}
            extB={l.extB}
            color={l.color}
          />
        ) : (
          <DimLabel key={l.key} position={l.pos} text={l.text} />
        )
      )}

      {/* Wall-mounted heaters for this section */}
      {(cfg.heaters || []).filter((h) => h.sectionId === sectionId).map((h, i) => {
        const sideLen = (h.side === 'front' || h.side === 'back') ? (x1 - x0) : (z1 - z0);
        const canDouble = sideLen > 15 * FT_TO_M; // > 15 ft
        const index = h.index ?? 0;
        const offset = canDouble
          ? (index === 0 ? -sideLen / 4 : sideLen / 4)
          : 0;
        return (
          <WallHeater key={`heater-${sectionId}-${i}`} side={h.side} x0={x0} x1={x1} z0={z0} z1={z1} height={height} color={addOnsHeaterColor(cfg)} offset={offset} />
        );
      })}

      {/* Outlets on posts for this section */}
      {(cfg.outlets || []).filter((o) => o.sectionId === sectionId).map((o) => {
        // Find post position from corners or extra posts
        let postPos = null;
        const cornerMatch = corners.find((c) => `${sectionId}-corner-${c.id}` === o.postKey);
        if (cornerMatch) {
          postPos = cornerMatch.pos;
        } else {
          const extraMatch = plan.extraPosts.find((p) => p.positionKey === o.postKey);
          if (extraMatch) {
            const pm = extraMatch.position * FT_TO_M;
            if (extraMatch.side === 'front') postPos = [x0 + pm, z1];
            else if (extraMatch.side === 'back') postPos = [x0 + pm, z0];
            else if (extraMatch.side === 'left') postPos = [x0, z0 + pm];
            else postPos = [x1, z0 + pm];
          }
        }
        if (!postPos) return null;

        // Compute inward direction (toward pergola center)
        const cx = (x0 + x1) / 2;
        const cz = (z0 + z1) / 2;
        const dx = cx - postPos[0];
        const dz = cz - postPos[1];
        const len = Math.sqrt(dx * dx + dz * dz) || 1;
        const inwardDir = [dx / len, dz / len];

        return <PostOutlet key={`outlet-${o.postKey}`} position={postPos} height={height} inwardDir={inwardDir} />;
      })}

      {/* Overall section dimensions */}
      {cfg.showDimensions && (
        <>
          {/* Length — offset forward above front beam */}
          <DimLine
            start={[x0, height + 0.6, z1 + 0.8]}
            end={[x1, height + 0.6, z1 + 0.8]}
            text={`${section.length}′ Length`}
            extA={[x0, height + 0.6, z1]}
            extB={[x1, height + 0.6, z1]}
            color="#c62828"
          />
          {/* Width — offset right above side beam */}
          <DimLine
            start={[x1 + 0.8, height + 0.6, z0]}
            end={[x1 + 0.8, height + 0.6, z1]}
            text={`${section.width}′ Width`}
            extA={[x1, height + 0.6, z0]}
            extB={[x1, height + 0.6, z1]}
            color="#c62828"
          />
          {/* Height — offset back from corner post */}
          <DimLine
            start={[x0 - 0.6, 0, z0 - 0.6]}
            end={[x0 - 0.6, height, z0 - 0.6]}
            text={`${section.height}′ Height`}
            extA={[x0, 0, z0 - 0.6]}
            extB={[x0, height, z0 - 0.6]}
            color="#2e7d32"
          />
        </>
      )}

      <SectionHighlight mod={mod} isActive={isActive && cfg.layout === 'l-shape'} />

      {/* Full-section hover glow for dimensions step */}
      <SectionHoverPlane />

      {/* Green glow on beam (heater) or post (outlet) where item was just added */}
      {activeFlashes.map((f) =>
        f.type === 'beam' ? (
          <BeamGlow key={f.id} position={f.pos} args={f.args} />
        ) : (
          <PostGlow key={f.id} position={f.pos} height={height} />
        )
      )}
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
    prev.cfg.lightColor === next.cfg.lightColor &&
    prev.cfg.isNight === next.cfg.isNight &&
    prev.cfg.editMode === next.cfg.editMode &&
    prev.cfg.showDimensions === next.cfg.showDimensions &&
    prev.cfg.walls === next.cfg.walls &&
    prev.cfg.screens === next.cfg.screens &&
    prev.cfg.sections === next.cfg.sections &&
    prev.cfg.extraPostPositions === next.cfg.extraPostPositions &&
    prev.cfg.removedPostKeys === next.cfg.removedPostKeys &&
    prev.cfg.heaters === next.cfg.heaters &&
    prev.cfg.outlets === next.cfg.outlets &&
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

  // Shared animated light material for all light strips (perimeter + junctions)
  const lightMat = useAnimatedLightMaterial(lightHex, 1.6, cfg);

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

      {cfg.lightColor !== 'none' && (
        <>
          <PerimeterLightStrip modules={modules} mat={lightMat} cfg={cfg} />
          {/* L-shape junction light strip on support beam if present */}
          {cfg.layout === 'l-shape' && modules.length === 2 && (() => {
            const m1 = modules[0];
            const m2 = modules[1];
            const configId = cfg.lShapeConfig || 'right-back';
            const y = avgHeight + BEAM_THICK - 0.10;
            const lights = [];
            
            // Calculate shared edge based on L-shape config
            if (configId === 'right-back' || configId === 'right-front') {
              const sharedX = m1.x + m1.w; // Section 1's right edge = Section 2's left edge
              const zStart = Math.max(m1.z, m2.z);
              const zEnd = Math.min(m1.z + m1.d, m2.z + m2.d);
              const len = zEnd - zStart - BEAM_THICK;
              if (len > 0) {
                lights.push(
                  <group key="lshape-junction-light">
                    <mesh position={[sharedX, y, (zStart + zEnd) / 2]} rotation={[0, 0, 0]}>
                      <boxGeometry args={[0.12, 0.05, len]} />
                      <primitive object={lightMat} attach="material" />
                    </mesh>
                  </group>
                );
              }
            } else if (configId === 'left-back' || configId === 'left-front') {
              const sharedX = m1.x; // Section 1's left edge = Section 2's right edge
              const zStart = Math.max(m1.z, m2.z);
              const zEnd = Math.min(m1.z + m1.d, m2.z + m2.d);
              const len = zEnd - zStart - BEAM_THICK;
              if (len > 0) {
                lights.push(
                  <group key="lshape-junction-light">
                    <mesh position={[sharedX, y, (zStart + zEnd) / 2]} rotation={[0, 0, 0]}>
                      <boxGeometry args={[0.12, 0.05, len]} />
                      <primitive object={lightMat} attach="material" />
                    </mesh>
                  </group>
                );
              }
            }
            
            return lights.length > 0 ? <>{lights}</> : null;
          })()}
          {/* Louver split junction lights for all sections */}
          {(() => {
            const y = avgHeight + BEAM_THICK - 0.10;
            const inset = 0.03;
            const lights = [];
            
            modules.forEach((mod) => {
              const modSets = louverSetCount(mod);
              if (modSets > 1) {
                const mx0 = mod.x, mx1 = mod.x + mod.w;
                const mz0 = mod.z, mz1 = mod.z + mod.d;
                const mShorterIsZ = mod.width <= mod.length;
                
                if (mShorterIsZ) {
                  // Louvers run along x, split along x — beam runs along z, light both sides
                  const span = mx1 - mx0;
                  const segLen = span / modSets;
                  for (let i = 1; i < modSets; i++) {
                    const splitX = mx0 + i * segLen;
                    lights.push(
                      <group key={`louver-split-${mod.sectionId}-${i}-left`}>
                        <mesh position={[splitX - BEAM_THICK / 2 - inset, y, (mz0 + mz1) / 2]} rotation={[0, 0, 0]}>
                          <boxGeometry args={[0.08, 0.05, mz1 - mz0 - BEAM_THICK]} />
                          <primitive object={lightMat} attach="material" />
                        </mesh>
                      </group>
                    );
                    lights.push(
                      <group key={`louver-split-${mod.sectionId}-${i}-right`}>
                        <mesh position={[splitX + BEAM_THICK / 2 + inset, y, (mz0 + mz1) / 2]} rotation={[0, 0, 0]}>
                          <boxGeometry args={[0.08, 0.05, mz1 - mz0 - BEAM_THICK]} />
                          <primitive object={lightMat} attach="material" />
                        </mesh>
                      </group>
                    );
                  }
                } else {
                  // Louvers run along z, split along z — beam runs along x, light both sides
                  const span = mz1 - mz0;
                  const segLen = span / modSets;
                  for (let i = 1; i < modSets; i++) {
                    const splitZ = mz0 + i * segLen;
                    lights.push(
                      <group key={`louver-split-${mod.sectionId}-${i}-back`}>
                        <mesh position={[(mx0 + mx1) / 2, y, splitZ - BEAM_THICK / 2 - inset]} rotation={[0, 0, 0]}>
                          <boxGeometry args={[mx1 - mx0 - BEAM_THICK, 0.05, 0.08]} />
                          <primitive object={lightMat} attach="material" />
                        </mesh>
                      </group>
                    );
                    lights.push(
                      <group key={`louver-split-${mod.sectionId}-${i}-front`}>
                        <mesh position={[(mx0 + mx1) / 2, y, splitZ + BEAM_THICK / 2 + inset]} rotation={[0, 0, 0]}>
                          <boxGeometry args={[mx1 - mx0 - BEAM_THICK, 0.05, 0.08]} />
                          <primitive object={lightMat} attach="material" />
                        </mesh>
                      </group>
                    );
                  }
                }
              }
            });
            
            return lights.length > 0 ? <>{lights}</> : null;
          })()}
        </>
      )}
    </group>
  );
}
