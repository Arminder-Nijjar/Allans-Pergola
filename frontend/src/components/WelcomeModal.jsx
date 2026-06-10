import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { ArrowRight, X, Sun, Shield, Ruler } from 'lucide-react';

// Simple animated louver demo for the intro
function DemoPergola() {
  const [tilt, setTilt] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTilt(t => (t + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);
  
  const rotation = (tilt / 100) * Math.PI * 0.4;
  
  return (
    <group>
      {/* Posts */}
      <mesh position={[-1.5, 1, -1]} castShadow>
        <boxGeometry args={[0.12, 2, 0.12]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[1.5, 1, -1]} castShadow>
        <boxGeometry args={[0.12, 2, 0.12]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-1.5, 1, 1]} castShadow>
        <boxGeometry args={[0.12, 2, 0.12]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[1.5, 1, 1]} castShadow>
        <boxGeometry args={[0.12, 2, 0.12]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
      </mesh>
      
      {/* Beams */}
      <mesh position={[-1.5, 2.1, 0]} castShadow>
        <boxGeometry args={[0.1, 0.12, 2.2]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[1.5, 2.1, 0]} castShadow>
        <boxGeometry args={[0.1, 0.12, 2.2]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
      </mesh>
      
      {/* Animated Louvers */}
      {[...Array(8)].map((_, i) => (
        <mesh 
          key={i} 
          position={[-1.5 + i * 0.43, 2.2, 0]} 
          rotation={[rotation, 0, 0]}
          castShadow
        >
          <boxGeometry args={[0.35, 0.03, 2]} />
          <meshStandardMaterial color="#e8e8e8" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

export default function WelcomeModal({ onStart }) {
  const [isOpen, setIsOpen] = useState(true);
  
  if (!isOpen) return null;
  
  const handleStart = () => {
    setIsOpen(false);
    onStart?.();
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-[#1a7a4b] text-white p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold pb-display">ALLAN'S LANDSCAPING</h1>
            <p className="text-white/80 text-sm">Premium Aluminum Pergola Builder</p>
          </div>
          <button 
            onClick={handleStart}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="grid md:grid-cols-2 gap-0">
          {/* Left: 3D Demo */}
          <div className="h-64 md:h-80 bg-gradient-to-b from-[#e8eef2] to-[#d4dde1]">
            <Canvas camera={{ position: [4, 3, 4], fov: 45 }} shadows>
              <ambientLight intensity={0.5} />
              <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
              <DemoPergola />
              <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2} />
              <Environment preset="sunset" background={false} />
            </Canvas>
            <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1 rounded-full text-xs font-medium text-[#5b6368]">
              Watch the louvers move!
            </div>
          </div>
          
          {/* Right: Content */}
          <div className="p-6 md:p-8 flex flex-col justify-center">
            <h2 className="text-xl font-bold text-[#14171a] mb-4 pb-display">
              Design Your Dream Outdoor Space
            </h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#e6f3eb] flex items-center justify-center flex-shrink-0">
                  <Ruler size={20} className="text-[#1a7a4b]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#14171a]">Custom Dimensions</h3>
                  <p className="text-sm text-[#5b6368]">10-30 ft lengths to fit any space</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#e6f3eb] flex items-center justify-center flex-shrink-0">
                  <Sun size={20} className="text-[#1a7a4b]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#14171a]">Motorized Louvers</h3>
                  <p className="text-sm text-[#5b6368]">Control sun & shade with a click</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#e6f3eb] flex items-center justify-center flex-shrink-0">
                  <Shield size={20} className="text-[#1a7a4b]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#14171a]">All-Weather Build</h3>
                  <p className="text-sm text-[#5b6368]">Powder-coated aluminum, built to last</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleStart}
              className="w-full py-4 bg-[#1a7a4b] hover:bg-[#156b3d] text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Building
              <ArrowRight size={20} />
            </button>
            
            <p className="text-xs text-[#5b6368] text-center mt-4">
              Free 3D visualization • Instant quote • Professional installation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
