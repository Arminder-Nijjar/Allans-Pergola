import React, { Suspense, useMemo, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Sky } from '@react-three/drei';
import * as THREE from 'three';
import PergolaModule from './PergolaModule';
import { getModules, getBoundingBox } from '../../utils/pergolaLayout';

// Paving stones with moss in gaps, irregular edges, wet sandy joints
function PaverDeck({ size }) {
  const tiles = 14;
  const tileSize = size / tiles;
  const gap = 0.025;

  const pavers = useMemo(() => {
    const arr = [];
    const offset = -(size / 2) + tileSize / 2;
    const warmShades = ['#c9b8a0', '#c4b098', '#bfa890', '#c7b29a', '#bcab92', '#d0c0a8', '#b5a58a', '#cdb8a0'];
    for (let x = 0; x < tiles; x++) {
      for (let z = 0; z < tiles; z++) {
        const shade = warmShades[Math.floor(Math.random() * warmShades.length)];
        const hOffset = (Math.random() - 0.5) * 0.012;
        const sizeVar = 0.92 + Math.random() * 0.12;
        const tiltX = (Math.random() - 0.5) * 0.015;
        const tiltZ = (Math.random() - 0.5) * 0.015;
        arr.push({
          x: offset + x * tileSize,
          z: offset + z * tileSize,
          color: shade,
          h: hOffset,
          sx: tileSize * sizeVar - gap,
          sz: tileSize * sizeVar - gap,
          tiltX,
          tiltZ,
        });
      }
    }
    return arr;
  }, [size, tileSize]);

  const moss = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 80; i++) {
      const x = (Math.random() - 0.5) * size;
      const z = (Math.random() - 0.5) * size;
      const r = 0.03 + Math.random() * 0.12;
      arr.push({ x, z, r });
    }
    return arr;
  }, [size]);

  return (
    <group>
      {/* Compacted sand base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[size + 2, size + 2]} />
        <meshStandardMaterial color="#9e8a6e" roughness={1} metalness={0} />
      </mesh>
      {/* Wet sand in joints */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#b0a088" roughness={0.95} metalness={0} />
      </mesh>
      {/* Individual stone pavers */}
      {pavers.map((p, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2 + p.tiltX, 0, p.tiltZ]}
          position={[p.x, -0.025 + p.h, p.z]}
          receiveShadow
          castShadow
        >
          <boxGeometry args={[p.sx, p.sz, 0.018]} />
          <meshStandardMaterial color={p.color} roughness={0.92} metalness={0.02} />
        </mesh>
      ))}
      {/* Moss patches in gaps */}
      {moss.map((m, i) => (
        <mesh key={`moss-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[m.x, -0.028, m.z]}>
          <circleGeometry args={[m.r, 6]} />
          <meshStandardMaterial color={Math.random() > 0.5 ? '#5a7c3a' : '#4a6b30'} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

// Lush grass with 3D blade tufts, wildflowers, pebble scatter
function GrassGround({ size }) {
  const tufts = useMemo(() => {
    const arr = [];
    const count = 500;
    const range = size * 1.5;
    const shades = ['#4e8540', '#5a7c3a', '#3d6b30', '#528a40', '#6b8f4e', '#4a7535'];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * range;
      const z = (Math.random() - 0.5) * range;
      const h = 0.04 + Math.random() * 0.1;
      const w = 0.02 + Math.random() * 0.04;
      const shade = shades[Math.floor(Math.random() * shades.length)];
      const leanX = (Math.random() - 0.5) * 0.3;
      const leanZ = (Math.random() - 0.5) * 0.3;
      arr.push({ x, z, h, w, shade, leanX, leanZ });
    }
    return arr;
  }, [size]);

  const dirtPatches = useMemo(() => {
    const arr = [];
    const count = 20;
    const range = size;
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * range;
      const z = (Math.random() - 0.5) * range;
      const r = 0.4 + Math.random() * 1.5;
      arr.push({ x, z, r });
    }
    return arr;
  }, [size]);

  const pebbles = useMemo(() => {
    const arr = [];
    const count = 50;
    const range = size;
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * range;
      const z = (Math.random() - 0.5) * range;
      const r = 0.02 + Math.random() * 0.05;
      arr.push({ x, z, r });
    }
    return arr;
  }, [size]);

  return (
    <group>
      {/* Earth base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
        <planeGeometry args={[size * 3, size * 3]} />
        <meshStandardMaterial color="#5a4a30" roughness={1} metalness={0} />
      </mesh>
      {/* Base turf */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.055, 0]} receiveShadow>
        <planeGeometry args={[size * 2, size * 2, 24, 24]} />
        <meshStandardMaterial color="#4e8540" roughness={1} metalness={0} />
      </mesh>
      {/* 3D grass blade tufts */}
      {tufts.map((t, i) => (
        <mesh key={i} rotation={[t.leanX, 0, t.leanZ]} position={[t.x, -0.05 + t.h / 2, t.z]}>
          <boxGeometry args={[t.w, t.h, t.w]} />
          <meshStandardMaterial color={t.shade} roughness={1} metalness={0} />
        </mesh>
      ))}
      {/* Dirt patches */}
      {dirtPatches.map((d, i) => (
        <mesh key={`dirt-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[d.x, -0.052, d.z]}>
          <circleGeometry args={[d.r, 8]} />
          <meshStandardMaterial color="#6a5a40" roughness={1} metalness={0} />
        </mesh>
      ))}
      {/* Scattered pebbles */}
      {pebbles.map((p, i) => (
        <mesh key={`pebble-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[p.x, -0.053, p.z]}>
          <circleGeometry args={[p.r, 5]} />
          <meshStandardMaterial color="#8a8070" roughness={0.9} metalness={0.05} />
        </mesh>
      ))}
    </group>
  );
}

// Real gravel with pebble mix, dust, and varied stone shapes
function GravelGround({ size }) {
  const stones = useMemo(() => {
    const arr = [];
    const count = 500;
    const range = size;
    const shades = ['#a89a88', '#b5a898', '#9e9080', '#c4b8a8', '#8a8070', '#b0a090', '#a09888', '#9a8a78', '#c0b0a0'];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * range;
      const z = (Math.random() - 0.5) * range;
      const w = 0.02 + Math.random() * 0.14;
      const d = w * (0.5 + Math.random() * 0.8);
      const h = 0.015 + Math.random() * 0.05;
      const shade = shades[Math.floor(Math.random() * shades.length)];
      const rotY = Math.random() * Math.PI * 2;
      const rotX = (Math.random() - 0.5) * 0.5;
      const rotZ = (Math.random() - 0.5) * 0.5;
      arr.push({ x, z, w, d, h, shade, rotY, rotX, rotZ });
    }
    return arr;
  }, [size]);

  const dustPatches = useMemo(() => {
    const arr = [];
    const count = 30;
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * size;
      const z = (Math.random() - 0.5) * size;
      const r = 0.3 + Math.random() * 1.5;
      arr.push({ x, z, r });
    }
    return arr;
  }, [size]);

  return (
    <group>
      {/* Earth base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
        <planeGeometry args={[size + 2, size + 2]} />
        <meshStandardMaterial color="#7a6a58" roughness={1} metalness={0} />
      </mesh>
      {/* Compacted fine gravel bed */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.045, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#a09888" roughness={1} metalness={0} />
      </mesh>
      {/* Dust / sand patches */}
      {dustPatches.map((d, i) => (
        <mesh key={`dust-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[d.x, -0.042, d.z]}>
          <circleGeometry args={[d.r, 8]} />
          <meshStandardMaterial color="#c4b8a8" roughness={1} metalness={0} transparent opacity={0.6} />
        </mesh>
      ))}
      {/* Individual 3D stones — partially embedded */}
      {stones.map((s, i) => (
        <mesh
          key={i}
          rotation={[s.rotX, s.rotY, s.rotZ]}
          position={[s.x, -0.04 + s.h * 0.25, s.z]}
          receiveShadow
          castShadow
        >
          <boxGeometry args={[s.w, s.h, s.d]} />
          <meshStandardMaterial color={s.shade} roughness={0.95} metalness={0.02} />
        </mesh>
      ))}
    </group>
  );
}

// Aged concrete with cracks, chips, stains, edge wear, surface pitting
function ConcreteGround({ size }) {
  const stains = useMemo(() => {
    const arr = [];
    const count = 25;
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * size;
      const z = (Math.random() - 0.5) * size;
      const r = 0.3 + Math.random() * 2.5;
      const shade = Math.random() > 0.5 ? '#8a8a8a' : '#787878';
      arr.push({ x, z, r, shade });
    }
    return arr;
  }, [size]);

  const cracks = useMemo(() => {
    const arr = [];
    const count = 12;
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * size;
      const z = (Math.random() - 0.5) * size;
      const len = 1 + Math.random() * 4;
      const rot = Math.random() * Math.PI;
      arr.push({ x, z, len, rot });
    }
    return arr;
  }, [size]);

  const chips = useMemo(() => {
    const arr = [];
    const count = 20;
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * size;
      const z = (Math.random() - 0.5) * size;
      const r = 0.02 + Math.random() * 0.08;
      arr.push({ x, z, r });
    }
    return arr;
  }, [size]);

  return (
    <group>
      {/* Main slab */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.045, 0]} receiveShadow>
        <planeGeometry args={[size, size, 24, 24]} />
        <meshStandardMaterial color="#a0a0a0" roughness={0.92} metalness={0.04} />
      </mesh>
      {/* Darker edge wear band */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.044, 0]}>
        <ringGeometry args={[size / 2 - 0.3, size / 2, 64]} />
        <meshStandardMaterial color="#8a8a8a" roughness={1} transparent opacity={0.4} />
      </mesh>
      {/* Weathering stains */}
      {stains.map((s, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[s.x, -0.043, s.z]}>
          <circleGeometry args={[s.r, 8]} />
          <meshStandardMaterial color={s.shade} roughness={0.95} transparent opacity={0.35} />
        </mesh>
      ))}
      {/* Surface chips / pits */}
      {chips.map((c, i) => (
        <mesh key={`chip-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[c.x, -0.042, c.z]}>
          <circleGeometry args={[c.r, 5]} />
          <meshStandardMaterial color="#6a6a6a" roughness={1} />
        </mesh>
      ))}
      {/* Cracks */}
      {cracks.map((c, i) => (
        <mesh key={`crack-${i}`} rotation={[-Math.PI / 2, 0, c.rot]} position={[c.x, -0.042, c.z]}>
          <planeGeometry args={[c.len, 0.015]} />
          <meshStandardMaterial color="#555555" roughness={1} />
        </mesh>
      ))}
      {/* Control joints */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow>
        <planeGeometry args={[size, 0.07]} />
        <meshStandardMaterial color="#6a6a6a" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, -0.04, 0]} receiveShadow>
        <planeGeometry args={[size, 0.07]} />
        <meshStandardMaterial color="#6a6a6a" roughness={1} />
      </mesh>
    </group>
  );
}

// Render the correct ground based on cfg
function GroundSurface({ size, groundType }) {
  switch (groundType) {
    case 'gravel': return <GravelGround size={size} />;
    case 'concrete': return <ConcreteGround size={size} />;
    case 'paving': return <PaverDeck size={size} />;
    case 'grass':
    default: return <GrassGround size={size} />;
  }
}

// Fluffy cloud made of overlapping spheres
function CloudCluster({ position, scale = 1 }) {
  const blobs = useMemo(() => [
    { x: 0, y: 0, z: 0, r: 1.2 },
    { x: -0.8, y: 0.15, z: 0.2, r: 0.9 },
    { x: 0.7, y: 0.1, z: -0.3, r: 1.0 },
    { x: 0.2, y: 0.3, z: 0.5, r: 0.8 },
    { x: -0.3, y: -0.1, z: -0.4, r: 0.7 },
  ], []);

  return (
    <group position={position} scale={scale}>
      {blobs.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, b.z]} castShadow={false}>
          <sphereGeometry args={[b.r, 16, 12]} />
          <meshStandardMaterial
            color="#ffffff"
            roughness={1}
            metalness={0}
            transparent
            opacity={0.92}
          />
        </mesh>
      ))}
    </group>
  );
}

// Clouds scattered across the sky
function Clouds() {
  const clouds = useMemo(() => [
    { pos: [-25, 18, -30], scale: 2.2 },
    { pos: [20, 22, -25], scale: 1.8 },
    { pos: [-10, 20, 25], scale: 2.0 },
    { pos: [30, 17, 15], scale: 1.6 },
    { pos: [-35, 21, 10], scale: 1.9 },
    { pos: [8, 19, -15], scale: 1.4 },
    { pos: [15, 24, 30], scale: 1.7 },
  ], []);

  return (
    <group>
      {clouds.map((c, i) => (
        <CloudCluster key={i} position={c.pos} scale={c.scale} />
      ))}
    </group>
  );
}

// Performance optimizer - enables frustum culling and optimizes rendering
function PerformanceOptimizer() {
  const { gl, scene, camera } = useThree();
  
  useEffect(() => {
    // Enable frustum culling
    scene.traverse((object) => {
      if (object.isMesh) {
        object.frustumCulled = true;
      }
    });
    
    // Optimize renderer
    gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    gl.shadowMap.needsUpdate = true;
    
    return () => {};
  }, [gl, scene]);
  
  // Trigger shadow map update when camera moves significantly
  useEffect(() => {
    const handleCameraChange = () => {
      gl.shadowMap.needsUpdate = true;
    };
    
    // Update shadows on initial render
    handleCameraChange();
    
    return () => {};
  }, [gl]);
  
  return null;
}

// Stable cache key for sections to avoid JSON.stringify perf overhead
function sectionsKey(sections) {
  let key = '';
  for (const s of sections) {
    key += `${s.id}:${s.length},${s.width},${s.height}|`;
  }
  return key;
}

// Perimeter lights along walls
function PerimeterLights({ modules, wallHeight, isNight, cfg }) {
  if (!isNight || modules.length === 0) return null;

  // Get bounding box of all modules
  const xs = modules.flatMap(m => [m.x, m.x + m.w]);
  const zs = modules.flatMap(m => [m.z, m.z + m.d]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);

  // For 10x12 kit, respect kitLightSides
  let hasBack = true, hasFront = true, hasLeft = true, hasRight = true;
  if (cfg?.layout === '10x12-kit') {
    const s = cfg.kitLightSides || 'front-back';
    if (s === 'none') return null;
    hasBack = s === 'front-back' || s === 'all';
    hasFront = s === 'front-back' || s === 'all';
    hasLeft = s === 'left-right' || s === 'all';
    hasRight = s === 'left-right' || s === 'all';
  }

  // Place lights at corners and along walls
  const lights = [];
  const lightY = wallHeight + 0.5;
  const spacing = 4; // meters between lights

  if (hasBack) {
    for (let x = minX; x <= maxX; x += spacing) {
      lights.push([x, lightY, minZ - 0.3]);
    }
  }
  if (hasFront) {
    for (let x = minX; x <= maxX; x += spacing) {
      lights.push([x, lightY, maxZ + 0.3]);
    }
  }
  if (hasLeft) {
    for (let z = minZ; z <= maxZ; z += spacing) {
      lights.push([minX - 0.3, lightY, z]);
    }
  }
  if (hasRight) {
    for (let z = minZ; z <= maxZ; z += spacing) {
      lights.push([maxX + 0.3, lightY, z]);
    }
  }

  return (
    <>
      {lights.map((pos, i) => (
        <group key={i}>
          {/* Downward spot for visible ground pool */}
          <spotLight
            position={pos}
            target-position={[pos[0], 0, pos[2]]}
            intensity={2.0}
            angle={Math.PI / 5}
            penumbra={0.6}
            distance={10}
            decay={2}
            color="#fff8e0"
            castShadow
          />
          {/* Ambient point glow around fixture */}
          <pointLight
            position={pos}
            intensity={1.5}
            distance={8}
            decay={2}
            color="#fff8e0"
          />
        </group>
      ))}
    </>
  );
}

export function Scene({ cfg, onFaceClick, stepId }) {
  const secKey = sectionsKey(cfg.sections);
  const extraPostPositions = cfg.extraPostPositions;
  const modules = useMemo(() => getModules(cfg), [cfg.layout, cfg.lShapeConfig, secKey, extraPostPositions, cfg.removedPostKeys, cfg.heaters, cfg.outlets]); // eslint-disable-line react-hooks/exhaustive-deps

  const bbox = useMemo(() => getBoundingBox(modules), [modules]);
  const cx = bbox.centerX;
  const cz = bbox.centerZ;
  const isNight = cfg.isNight || false;
  const avgH = modules.length > 0 ? modules.reduce((sum, m) => sum + m.h, 0) / modules.length : 0;

  return (
    <group position={[-cx, 0, -cz]}>
      <GroundSurface size={50} groundType={cfg.groundType} />
      {!isNight && <Clouds />}
      {/* Day/Night lighting */}
      {isNight ? (
        <>
          <ambientLight intensity={0.15} />
          <directionalLight position={[5, 10, 5]} intensity={0.4} castShadow />
          <spotLight position={[0, 10, 0]} intensity={0.5} angle={Math.PI / 2} penumbra={0.5} />
          <PerimeterLights modules={modules} wallHeight={avgH} isNight={isNight} cfg={cfg} />
        </>
      ) : (
        <>
          <ambientLight intensity={0.6} />
          <directionalLight position={[15, 20, 10]} intensity={1.8} castShadow shadow-mapSize={[4096, 4096]} />
          <directionalLight position={[-10, 12, -8]} intensity={0.6} />
          <spotLight position={[0, 15, -20]} intensity={0.5} angle={Math.PI / 4} penumbra={0.5} target-position={[0, 0, 0]} />
          <hemisphereLight args={['#fff8e7', '#5a4a3a', 0.6]} />
        </>
      )}
      <PergolaModule cfg={cfg} modules={modules} onFaceClick={onFaceClick} isNight={isNight} stepId={stepId} />
    </group>
  );
}

export default function PergolaScene({ cfg, onFaceClick, stepId }) {
  const secKey = sectionsKey(cfg.sections);
  const extraPostPositions = cfg.extraPostPositions;
  const modules = useMemo(() => getModules(cfg), [cfg.layout, cfg.lShapeConfig, secKey, extraPostPositions, cfg.removedPostKeys, cfg.heaters, cfg.outlets]); // eslint-disable-line react-hooks/exhaustive-deps
  const bbox = useMemo(() => getBoundingBox(modules), [modules]);

  const maxDim = Math.max(bbox.width, bbox.depth);
  const cam = maxDim * 1.3 + 4;
  const avgHeight = modules.length > 0 ? modules.reduce((sum, m) => sum + m.h, 0) / modules.length : 0;
  const targetY = avgHeight * 0.55;

  return (
    <Canvas
      shadows
      camera={{ position: [cam * 0.9, cam * 0.5, cam], fov: 42 }}
      gl={{ 
        antialias: true, 
        preserveDrawingBuffer: true, 
        powerPreference: 'high-performance',
        shadowMapType: THREE.PCFSoftShadowMap
      }}
      dpr={[1, 1.5]} // Reduced from [1, 1.75] for better performance
      frameloop="demand" // Only render when needed
    >
      <PerformanceOptimizer />
      
      <color attach="background" args={cfg.isNight ? ['#0a0a15'] : ['#87CEEB']} />
      <fog attach="fog" args={cfg.isNight ? ['#1a1a2e', 20, 80] : ['#c8e0f0', 30, 100]} />

      <Suspense fallback={null}>
        {/* Sky - day or night */}
        {cfg.isNight ? (
          <Sky 
            distance={450000} 
            sunPosition={[0, -10, 0]} 
            inclination={0} 
            azimuth={0.25} 
            turbidity={20} 
            rayleigh={0.5}
            mieCoefficient={0.02}
            mieDirectionalG={0.8}
          />
        ) : (
          <Sky
            distance={450000}
            sunPosition={[100, 80, -50]}
            inclination={0.5}
            azimuth={0.3}
            turbidity={2}
            rayleigh={1.2}
            mieCoefficient={0.003}
            mieDirectionalG={0.8}
          />
        )}
        {/* Studio environment for aluminum reflections */}
        <Environment preset={cfg.isNight ? "night" : "city"} background={false} />
        <Scene cfg={cfg} onFaceClick={onFaceClick} stepId={stepId} />
        <ContactShadows position={[0, 0.002, 0]} opacity={0.6} scale={40} blur={3} far={8} />
      </Suspense>

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={4}
        maxDistance={28}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, targetY, 0]}
      />
    </Canvas>
  );
}
