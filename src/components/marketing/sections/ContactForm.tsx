'use client';

import { useState } from 'react';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const field =
  'mt-1 w-full rounded-lg border border-mk-line bg-mk-bg px-3 py-2.5 outline-none focus:border-mk-brand';

export function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="rounded-2xl border border-mk-line bg-mk-surface p-8 text-center">
        <h3 className="mk-heading text-xl font-semibold">Thanks, message received</h3>
        <p className="mt-2 text-mk-muted">We&apos;ll get back to you by email soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm font-medium">
        Name
        <input name="name" required maxLength={100} className={field} />
      </label>
      <label className="block text-sm font-medium">
        Email
        <input name="email" type="email" required maxLength={200} className={field} />
      </label>
      <label className="block text-sm font-medium">
        Message
        <textarea name="message" required minLength={10} maxLength={3000} rows={5} className={field} />
      </label>
      {/* honeypot: hidden from people, bots fill it */}
      <input name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {status === 'error' && <p className="text-sm text-rose-600">Something went wrong. Please try again.</p>}
      <button
        type="submit"
        disabled={status === 'sending'}
        className="h-11 w-full rounded-lg bg-mk-brand font-semibold text-mk-brand-fg disabled:opacity-60"
      >
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}