import React, { useState } from 'react';
import { StepHeader } from './_shared';
import { toast } from 'sonner';
import axios from 'axios';
import { Loader2, Home, AlertCircle } from 'lucide-react';

const API = (() => {
  const envUrl = process.env.REACT_APP_BACKEND_URL;
  if (envUrl) return `${envUrl}/api`;
  // Local dev: proxy to backend server
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:8000/api';
  }
  // Production: same-origin relative path
  return '/api';
})();

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function QuoteStep({ cfg, stepNum, total, onSubmitted, compareState }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

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
        </div>
      </form>
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

