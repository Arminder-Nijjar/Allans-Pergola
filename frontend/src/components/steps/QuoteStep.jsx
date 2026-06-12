import React, { useState } from 'react';
import { StepHeader } from './_shared';
import { toast } from 'sonner';
import axios from 'axios';
import { Loader2, Home, AlertCircle, X, FileText } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function QuoteStep({ cfg, stepNum, total, onSubmitted, compareState }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showBill, setShowBill] = useState(false);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const valid =
    form.name.trim().length >= 2 &&
    emailRe.test(form.email.trim()) &&
    form.phone.trim().replace(/\D/g, '').length >= 7;

  const buildShareUrl = () => {
    try {
      const base = window.location.origin + window.location.pathname;
      const json = JSON.stringify(cfg);
      const encoded = encodeURIComponent(btoa(json));
      return `${base}?config=${encoded}`;
    } catch {
      return window.location.href;
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim() || null,
        notes: form.notes.trim() || null,
        config: cfg,
        share_url: buildShareUrl(),
      };
      const { data } = await axios.post(`${API}/quotes`, payload);
      onSubmitted(data);
    } catch (err) {
      const detail = err?.response?.data?.detail || err.message;
      toast.error('Could not submit', { description: typeof detail === 'string' ? detail : 'Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-fadeup">
      <StepHeader
        stepNum={stepNum}
        total={total}
        title="Submit your design"
        subtitle="We’ll review your design and email a design consultation shortly."
      />

      {/* Which pergola is being submitted */}
      {compareState?.isComparing && (
        <div className="mb-4 bg-[#f0fdf4] border-2 border-[#86efac] rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-[#1a7a4b] rounded-full flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-[#1a7a4b] uppercase tracking-wide">Submitting</div>
              <div className="text-lg font-bold text-[#14171a]">
                Pergola {compareState.activeConfigTab || 'A'}
                <span className="text-[#5b6368] font-normal text-base ml-2">
                  {cfg.sections.map(s => `${s.length}′×${s.width}′`).join(' + ')}
                </span>
              </div>
              <p className="text-xs text-[#5b6368] mt-1">
                This is the design our team will review. Want to submit the other one? Switch tabs on the top.
              </p>
            </div>
            <AlertCircle className="w-5 h-5 text-[#1a7a4b] flex-shrink-0 mt-1" />
          </div>
        </div>
      )}

      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="quote-form">
        <Field label="Full name" required>
          <input
            data-testid="quote-name"
            className="pb-input"
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="Jane Smith"
            autoComplete="name"
          />
        </Field>
        <Field label="Email" required>
          <input
            data-testid="quote-email"
            type="email"
            className="pb-input"
            value={form.email}
            onChange={(e) => set({ email: e.target.value })}
            placeholder="jane@example.com"
            autoComplete="email"
          />
        </Field>
        <Field label="Phone" required>
          <input
            data-testid="quote-phone"
            className="pb-input"
            value={form.phone}
            onChange={(e) => set({ phone: e.target.value })}
            placeholder="(555) 123-4567"
            autoComplete="tel"
          />
        </Field>
        <Field label="Address (optional)">
          <input
            data-testid="quote-address"
            className="pb-input"
            value={form.address}
            onChange={(e) => set({ address: e.target.value })}
            placeholder="Street, city"
            autoComplete="street-address"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Notes for our team (optional)">
            <textarea
              data-testid="quote-notes"
              className="pb-input"
              rows={3}
              value={form.notes}
              onChange={(e) => set({ notes: e.target.value })}
              placeholder="Anything we should know about your space?"
            />
          </Field>
        </div>
        <div className="sm:col-span-2 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={!valid || submitting}
            className="pb-btn pb-btn-accent"
            data-testid="quote-submit"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            Send my design
          </button>
          <button
            type="button"
            onClick={() => setShowBill(true)}
            className="pb-btn pb-btn-ghost flex items-center gap-2"
          >
            <FileText size={16} />
            View Bill
          </button>
        </div>
      </form>

      {showBill && <InvoiceModal cfg={cfg} onClose={() => setShowBill(false)} />}
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="block text-[11px] pb-mono uppercase tracking-widest text-[#5b6368] mb-1.5">
        {label} {required && <span className="text-[#c0392b]">*</span>}
      </span>
      {children}
    </label>
  );
}

function InvoiceModal({ cfg, onClose }) {
  const isKit = cfg.layout === '10x12-kit';
  const section = cfg.sections[0];

  const buildLines = () => {
    const lines = [];
    let subtotal = 0;

    if (isKit) {
      lines.push({ item: 'Pergola Kit', desc: "10' × 12' × 9' — Frame: Umbra Grey, Louvers: Pure White", qty: 1, rate: 10000 });
      subtotal += 10000;

      if (cfg.louverOperation === 'motorized') {
        lines.push({ item: 'Louver Upgrade', desc: 'Motorized louvers (remote control)', qty: 1, rate: 2200 });
        subtotal += 2200;
      }

      const kitLightSides = cfg.kitLightSides || 'front-back';
      if (kitLightSides !== 'none' && cfg.lightColor !== 'none') {
        const lightPrice = cfg.lightColor === 'rgb' ? 2250 : 1850;
        const colorName = cfg.lightColor === 'rgb' ? 'RGB Multi-color' : 'Warm White';
        lines.push({ item: 'LED Lighting', desc: `${colorName} — Front + Back (12 ft sides)`, qty: 1, rate: lightPrice });
        subtotal += lightPrice;
      }

      cfg.screens.forEach((s) => {
        const sideLen = s.side === 'front' || s.side === 'back' ? 12 : 10;
        const price = sideLen === 12 ? 3050 : 2850;
        const color = (cfg.screenColor || 'white').replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        lines.push({ item: 'Manual Screen', desc: `${s.side.charAt(0).toUpperCase() + s.side.slice(1)} — ${sideLen} ft (${color})`, qty: 1, rate: price });
        subtotal += price;
      });

      cfg.walls.forEach((w) => {
        const sideLen = w.side === 'front' || w.side === 'back' ? 12 : 10;
        const price = sideLen === 12 ? 5940 : 4950;
        lines.push({ item: 'Privacy Wall', desc: `${w.side.charAt(0).toUpperCase() + w.side.slice(1)} — ${sideLen} ft`, qty: 1, rate: price });
        subtotal += price;
      });
    } else {
      lines.push({ item: 'Custom Pergola', desc: 'Pricing available upon consultation', qty: 1, rate: 0 });
    }

    const gst = Math.round(subtotal * 0.05 * 100) / 100;
    const pst = Math.round(subtotal * 0.06 * 100) / 100;
    const total = Math.round((subtotal + gst + pst) * 100) / 100;

    return { lines, subtotal, gst, pst, total };
  };

  const { lines, subtotal, gst, pst, total } = buildLines();

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden">
        {/* Header */}
        <div className="bg-[#1a3a2f] text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Quote Summary</h2>
            <p className="text-sm opacity-80 mt-1">Allan's Landscaping & Disposal</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Customer info preview */}
          <div className="mb-6 pb-4 border-b border-[#ececea]">
            <p className="text-sm text-[#5b6368]">
              <strong className="text-[#14171a]">Kit:</strong> {isKit ? "10×12 Standard Kit" : "Custom Pergola"}
              {isKit && (
                <span className="ml-4">
                  <strong className="text-[#14171a]">Size:</strong> {section.length}′ × {section.width}′ × {section.height}′
                </span>
              )}
            </p>
          </div>

          {/* Invoice table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-[#14171a]">
                  <th className="text-left py-2 px-2 font-semibold text-[#14171a]">Item</th>
                  <th className="text-left py-2 px-2 font-semibold text-[#14171a]">Description</th>
                  <th className="text-right py-2 px-2 font-semibold text-[#14171a]">Qty</th>
                  <th className="text-right py-2 px-2 font-semibold text-[#14171a]">Rate</th>
                  <th className="text-right py-2 px-2 font-semibold text-[#14171a]">Amount</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => (
                  <tr key={i} className="border-b border-[#ececea]">
                    <td className="py-3 px-2 text-[#14171a] font-medium">{line.item}</td>
                    <td className="py-3 px-2 text-[#5b6368]">{line.desc}</td>
                    <td className="py-3 px-2 text-right text-[#5b6368]">{line.qty}</td>
                    <td className="py-3 px-2 text-right text-[#5b6368]">${line.rate.toLocaleString()}</td>
                    <td className="py-3 px-2 text-right font-semibold text-[#14171a]">${(line.qty * line.rate).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          {isKit && (
            <div className="mt-6 flex justify-end">
              <div className="w-full sm:w-72 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#5b6368]">Subtotal</span>
                  <span className="font-semibold text-[#14171a]">${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#5b6368]">GST (5%)</span>
                  <span className="text-[#14171a]">${gst.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#5b6368]">PST (6%)</span>
                  <span className="text-[#14171a]">${pst.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t-2 border-[#14171a] pt-2 mt-2">
                  <span className="text-[#14171a]">Total</span>
                  <span className="text-[#1a7a4b]">${total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-[#5b6368] mt-6 text-center">
            Supply only. Not including installation or delivery. Pick-up price. Taxes included.
          </p>
        </div>
      </div>
    </div>
  );
}
