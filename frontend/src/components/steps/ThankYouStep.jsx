import React from 'react';
import { CheckCircle2, Mail, RotateCcw } from 'lucide-react';

export default function ThankYouStep({ quote, onRestart }) {
  return (
    <div className="pb-fadeup max-w-xl" data-testid="thank-you-step">
      <div className="w-14 h-14 rounded-full bg-[#e7f1ea] flex items-center justify-center mb-5">
        <CheckCircle2 size={28} className="text-[#1a7a4b]" />
      </div>
      <p className="pb-mono text-[11px] tracking-[0.22em] uppercase text-[#1a7a4b]">Design received</p>
      <h2 className="pb-display text-3xl md:text-4xl font-semibold text-[#14171a] mt-1 leading-[1.1]">
        Thank you{quote?.name ? `, ${quote.name.split(' ')[0]}` : ''}.
      </h2>
      <p className="text-[#5b6368] mt-3">
        We’ve received your pergola design. Our team will review the details and contact you shortly at{' '}
        <span className="font-semibold text-[#14171a]">{quote?.email}</span> to discuss your project.
      </p>
      <div className="pb-card mt-6 p-4 flex items-start gap-3">
        <Mail size={18} className="mt-0.5 text-[#5b6368] flex-shrink-0" />
        <p className="text-sm text-[#5b6368]">
          Reference&nbsp;
          <span className="pb-mono text-[#14171a]">#{quote?.id?.slice(0, 8).toUpperCase()}</span>
          — keep this handy if you need to follow up.
        </p>
      </div>
      <button onClick={onRestart} className="pb-btn pb-btn-ghost mt-6" data-testid="restart-btn">
        <RotateCcw size={15} /> Design another
      </button>
    </div>
  );
}
