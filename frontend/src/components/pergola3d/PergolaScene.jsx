import React, { Suspense, useMemo, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Sky } from '@react-three/drei';
import * as THREE from 'three';
import PergolaModule from './PergolaModule';
import { getModules, getBoundingBox } from '../../utils/pergolaLayout';

// Warm stone paver patio for backyard look
function Deck({ size }) {
  const tiles = 10;
  const tileSize = size / tiles;
  const gap = 0.06;

  const pavers = useMemo(() => {
    const arr = [];
    const offset = -(size / 2) + tileSize / 2;
    const warmShades = ['#c9b8a0', '#c4b098', '#bfa890', '#c7b29a', '#bcab92'];
    for (let x = 0; x < tiles; x++) {
      for (let z = 0; z < tiles; z++) {
        // Random warm stone color
        const shade = warmShades[(x * tiles + z) % warmShades.length];
        arr.push({
          x: offset + x * tileSize,
          z: offset + z * tileSize,
          color: shade,
        });
      }
    }
    return arr;
  }, [size, tileSize]);

  return (
    <group>
      {/* Sand/dirt base beneath pavers */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial
          color="#9e8a6e"
          roughness={1}
          metalness={0}
        />
      </mesh>
      {/* Individual stone pavers */}
      {pavers.map((p, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[p.x, -0.018, p.z]}
          receiveShadow
        >
          <planeGeometry args={[tileSize - gap, tileSize - gap]} />
          <meshStandardMaterial
            color={p.color}
            roughness={0.9}
            metalness={0.02}
          />
        </mesh>
      ))}
      {/* Outer patio border */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.025, 0]} receiveShadow>
        <ringGeometry args={[size / 2 - 0.25, size / 2, 64]} />
        <meshStandardMaterial
          color="#a89780"
          roughness={0.9}
          metalness={0.02}
        />
      </mesh>
    </group>
  );
}

// Realistic grass lawn with subtle organic color variation
function Ground({ size }) {
  const patches = useMemo(() => {
    const arr = [];
    const count = 40;
    const range = size * 1.2;
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * range * 2;
      const z = (Math.random() - 0.5) * range * 2;
      const r = 2 + Math.random() * 4;
      const shade = Math.random() > 0.5 ? '#4a7c3a' : '#528a40';
      arr.push({ x, z, r, shade });
    }
    return arr;
  }, [size]);

  return (
    <group>
      {/* Base grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]} receiveShadow>
        <planeGeometry args={[size * 3, size * 3]} />
        <meshStandardMaterial
          color="#4e8540"
          roughness={1}
          metalness={0}
        />
      </mesh>
      {/* Organic color patches for realism */}
      {patches.map((p, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[p.x, -0.055, p.z]}
          receiveShadow
        >
          <circleGeometry args={[p.r, 8]} />
          <meshStandardMaterial
            color={p.shade}
            roughness={1}
            metalness={0}
          />
        </mesh>
      ))}
    </group>
  );
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
    gl.shadowMap.autoUpdate = false; // Manual shadow updates for performance
    gl.shadowMap.needsUpdate = true;
    
    return () => {
      gl.shadowMap.autoUpdate = true;
    };
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
        <pointLight
          key={i}
          position={pos}
          intensity={0.6}
          distance={8}
          decay={2}
          color="#fff8e0"
        />
      ))}
    </>
  );
}

function Scene({ cfg, onFaceClick, stepId }) {
  const secKey = sectionsKey(cfg.sections);
  const extraPostPositions = cfg.extraPostPositions;
  const modules = useMemo(() => getModules(cfg), [cfg.layout, cfg.lShapeConfig, secKey, extraPostPositions]); // eslint-disable-line react-hooks/exhaustive-deps

  const bbox = useMemo(() => getBoundingBox(modules), [modules]);
  const cx = bbox.centerX;
  const cz = bbox.centerZ;
  const isNight = cfg.isNight || false;
  const avgH = modules.length > 0 ? modules.reduce((sum, m) => sum + m.h, 0) / modules.length : 0;

  return (
    <group position={[-cx, 0, -cz]}>
      <Ground size={50} />
      <Deck size={50} />
      {!isNight && <Clouds />}
      {/* Day/Night lighting */}
      {isNight ? (
        <>
          <ambientLight intensity={0.05} />
          <directionalLight position={[5, 10, 5]} intensity={0.2} castShadow />
          <spotLight position={[0, 10, 0]} intensity={0.3} angle={Math.PI / 2} penumbra={0.5} />
          <PerimeterLights modules={modules} wallHeight={avgH} isNight={isNight} cfg={cfg} />
        </>
      ) : (
        <>
          <ambientLight intensity={0.4} />
          <directionalLight position={[15, 20, 10]} intensity={1.0} castShadow shadow-mapSize={[2048, 2048]} />
          <directionalLight position={[-10, 12, -8]} intensity={0.4} />
          <spotLight position={[0, 15, -20]} intensity={0.3} angle={Math.PI / 4} penumbra={0.5} target-position={[0, 0, 0]} />
          <hemisphereLight args={['#fff8e7', '#5a4a3a', 0.45]} />
        </>
      )}
      <PergolaModule cfg={cfg} modules={modules} onFaceClick={onFaceClick} isNight={isNight} stepId={stepId} />
    </group>
  );
}

export default function PergolaScene({ cfg, onFaceClick, stepId }) {
  const secKey = sectionsKey(cfg.sections);
  const extraPostPositions = cfg.extraPostPositions;
  const modules = useMemo(() => getModules(cfg), [cfg.layout, cfg.lShapeConfig, secKey, extraPostPositions]); // eslint-disable-line react-hooks/exhaustive-deps
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
