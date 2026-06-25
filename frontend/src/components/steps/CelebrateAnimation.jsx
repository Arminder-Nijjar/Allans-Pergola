import React, { useEffect, useState } from 'react';
import { PartyPopper } from 'lucide-react';

export default function CelebrateAnimation({ onDone }) {
  const [phase, setPhase] = useState('in'); // 'in' | 'hold' | 'out'

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 800);
    const t2 = setTimeout(() => setPhase('out'), 2200);
    const t3 = setTimeout(() => onDone && onDone(), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  const particles = [
    { color: '#1a7a4b', x: -120, y: -80, size: 12, delay: 0 },
    { color: '#e8c547', x: 100, y: -100, size: 10, delay: 0.05 },
    { color: '#1a7a4b', x: 140, y: 40, size: 8, delay: 0.1 },
    { color: '#c98a2a', x: -90, y: 90, size: 14, delay: 0.08 },
    { color: '#1a7a4b', x: 60, y: 120, size: 9, delay: 0.12 },
    { color: '#e8c547', x: -140, y: 20, size: 11, delay: 0.03 },
    { color: '#1a7a4b', x: 20, y: -140, size: 10, delay: 0.15 },
    { color: '#c98a2a', x: -60, y: -110, size: 7, delay: 0.07 },
    { color: '#e8c547', x: 120, y: -40, size: 13, delay: 0.11 },
    { color: '#1a7a4b', x: -40, y: 130, size: 8, delay: 0.06 },
    { color: '#c98a2a', x: 80, y: 80, size: 10, delay: 0.09 },
    { color: '#e8c547', x: -110, y: -50, size: 9, delay: 0.14 },
  ];

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center overflow-hidden"
      style={{
        background: phase === 'out'
          ? 'rgba(20,23,26,0)'
          : 'rgba(20,23,26,0.88)',
        backdropFilter: phase === 'out' ? 'blur(0px)' : 'blur(8px)',
        transition: 'background 0.8s ease, backdrop-filter 0.8s ease',
        pointerEvents: phase === 'out' ? 'none' : 'auto',
      }}
    >
      {/* Particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: p.color,
            left: '50%',
            top: '50%',
            opacity: phase === 'in' ? 1 : 0,
            transform: phase === 'in'
              ? `translate(${p.x}px, ${p.y}px) scale(1)`
              : `translate(${p.x * 1.8}px, ${p.y * 1.8}px) scale(0)`,
            transition: `transform 0.9s cubic-bezier(.2,.8,.2,1) ${p.delay}s, opacity 0.6s ease ${p.delay + 0.2}s`,
          }}
        />
      ))}

      {/* Star burst rings */}
      <div
        className="absolute rounded-full border-2 border-[#e8c547]/60"
        style={{
          width: 80, height: 80,
          left: 'calc(50% - 40px)', top: 'calc(50% - 40px)',
          opacity: phase === 'in' ? 1 : 0,
          transform: phase === 'in' ? 'scale(2.5)' : 'scale(0)',
          transition: 'transform 0.8s cubic-bezier(.2,.8,.2,1), opacity 0.6s ease',
        }}
      />
      <div
        className="absolute rounded-full border border-[#1a7a4b]/40"
        style={{
          width: 120, height: 120,
          left: 'calc(50% - 60px)', top: 'calc(50% - 60px)',
          opacity: phase === 'in' ? 1 : 0,
          transform: phase === 'in' ? 'scale(2)' : 'scale(0)',
          transition: 'transform 1s cubic-bezier(.2,.8,.2,1) 0.1s, opacity 0.6s ease 0.2s',
        }}
      />

      {/* Center content */}
      <div
        className="relative flex flex-col items-center"
        style={{
          opacity: phase === 'in' ? 1 : 0,
          transform: phase === 'in'
            ? 'scale(1) translateY(0)'
            : 'scale(0.85) translateY(20px)',
          transition: 'transform 0.6s cubic-bezier(.2,.8,.2,1), opacity 0.5s ease',
        }}
      >
        <div
          className="w-24 h-24 rounded-3xl bg-[#e7f1ea] flex items-center justify-center mb-6"
          style={{
            transform: phase === 'in' ? 'scale(1) rotate(0deg)' : 'scale(0.5) rotate(-20deg)',
            transition: 'transform 0.7s cubic-bezier(.34,1.56,.64,1)',
          }}
        >
          <PartyPopper size={48} className="text-[#1a7a4b]" />
        </div>
        <h1
          className="pb-display text-[52px] md:text-[72px] font-bold text-white leading-none tracking-[-0.03em]"
          style={{
            textShadow: '0 4px 24px rgba(0,0,0,0.3)',
          }}
        >
          Hooray!!
        </h1>
        <p
          className="text-white/70 text-lg mt-3 font-medium"
          style={{
            transform: phase === 'in' ? 'translateY(0)' : 'translateY(10px)',
            opacity: phase === 'in' ? 1 : 0,
            transition: 'transform 0.5s ease 0.2s, opacity 0.5s ease 0.2s',
          }}
        >
          You built something amazing
        </p>
      </div>
    </div>
  );
}
