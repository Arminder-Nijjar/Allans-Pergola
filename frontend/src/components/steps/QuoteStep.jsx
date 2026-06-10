import React, { useState } from 'react';
import { StepHeader } from './_shared';
import { toast } from 'sonner';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function QuoteStep({ cfg, stepNum, total, onSubmitted }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const valid =
    form.name.trim().length >= 2 &&
    emailRe.test(form.email.trim()) &&
    form.phone.trim().replace(/\D/g, '').length >= 7;

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
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={!valid || submitting}
            className="pb-btn pb-btn-accent w-full sm:w-auto"
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
