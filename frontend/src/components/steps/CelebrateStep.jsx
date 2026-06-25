import React, { useState } from 'react';
import { Maximize2, PartyPopper, Star } from 'lucide-react';
import { louverSetCount, louverOperation } from '../../utils/pergolaRules';
import CelebrateAnimation from './CelebrateAnimation';

export default function CelebrateStep({ cfg, setCfg, stepNum, total }) {
  const [showAnim, setShowAnim] = useState(true);
  const section = cfg.sections[0];
  const sets = louverSetCount(section);
  const op = louverOperation(section, cfg);
  const dims = cfg.sections.map((s) => `${s.length}′ × ${s.width}′`).join(' + ');

  const goFullscreen = () => setCfg((c) => ({ ...c, fs: true }));

  return (
    <>
      {showAnim && <CelebrateAnimation onDone={() => setShowAnim(false)} />}
      <div className="pb-fadeup flex flex-col items-center text-center py-8">
      {/* Floating stars decoration */}
      <div className="relative mb-6">
        <span className="absolute -top-2 -left-6 text-2xl animate-bounce" style={{ animationDelay: '0s' }}>
          <Star size={20} className="text-[#e8c547] fill-[#e8c547]" />
        </span>
        <span className="absolute -top-1 -right-5 text-xl animate-bounce" style={{ animationDelay: '0.3s' }}>
          <Star size={16} className="text-[#e8c547] fill-[#e8c547]" />
        </span>
        <span className="absolute top-8 -left-8 text-lg animate-bounce" style={{ animationDelay: '0.6s' }}>
          <Star size={14} className="text-[#e8c547] fill-[#e8c547]" />
        </span>
        <div className="w-20 h-20 rounded-2xl bg-[#e7f1ea] flex items-center justify-center mx-auto">
          <PartyPopper size={40} className="text-[#1a7a4b]" />
        </div>
      </div>

      <h2 className="pb-display text-[32px] md:text-[40px] font-semibold text-[#14171a] leading-[1.1] tracking-[-0.02em]">
        Hooray!
      </h2>
      <p className="text-[#5b6368] text-lg mt-3 max-w-sm leading-relaxed">
        You made a perfect looking pergola. It looks amazing!
      </p>

      {/* Mini summary card */}
      <div className="mt-8 w-full max-w-sm bg-[#fafaf8] border border-[#eaeae6] rounded-2xl p-5 text-left">
        <p className="text-[10px] pb-mono uppercase tracking-widest text-[#8a8f94] mb-3">Your Design</p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#5b6368]">Size</span>
            <span className="font-semibold text-[#14171a]">{dims}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#5b6368]">Style</span>
            <span className="font-semibold text-[#14171a]">{cfg.style === 'attached' ? 'Attached' : cfg.style === '10x12-kit' ? 'Standard Kit' : 'Freestanding'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#5b6368]">Louvers</span>
            <span className="font-semibold text-[#14171a]">{sets} {sets > 1 ? 'sets' : 'set'} · {op === 'motorized' ? 'Motorized' : 'Manual'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#5b6368]">Walls</span>
            <span className="font-semibold text-[#14171a]">{cfg.walls.length} placed</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#5b6368]">Screens</span>
            <span className="font-semibold text-[#14171a]">{cfg.screens.length} placed</span>
          </div>
        </div>
      </div>

      {/* Fullscreen CTA */}
      <button
        type="button"
        onClick={goFullscreen}
        className="mt-8 w-full max-w-sm flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-[#14171a] text-white font-semibold text-base transition-all hover:bg-black hover:shadow-[0_8px_24px_rgba(20,23,26,0.2)] active:scale-[0.98]"
      >
        <Maximize2 size={18} />
        View it in Fullscreen
      </button>

      <p className="text-xs text-[#8a8f94] mt-4">
        Tap Next to review everything before submitting.
      </p>
    </div>
    </>
  );
}
