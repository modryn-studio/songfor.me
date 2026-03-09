'use client';

import { useState, type FormEvent } from 'react';
import { analytics } from '@/lib/analytics';
import { site } from '@/config/site';

export default function EmailSignup() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitting) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'newsletter', email }),
      });

      if (!res.ok) {
        setError('Something went wrong. Try again.');
        return;
      }

      setDone(true);
      analytics.newsletterSignup();
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="signup" className="border-border border-t">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="mx-auto max-w-lg text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            {site.waitlist.headline}
          </h2>
          <p className="text-muted mt-4 font-mono text-sm md:text-base">
            {site.waitlist.subheadline}
          </p>

          {!done ? (
            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <label htmlFor="signup-email" className="sr-only">
                Email address
              </label>
              <input
                id="signup-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submitting}
                className="border-border placeholder:text-muted focus-visible:ring-accent h-12 flex-1 rounded-none border-2 bg-transparent px-4 font-mono text-sm focus-visible:ring-1 focus-visible:outline-none"
              />
              <button
                type="submit"
                disabled={submitting}
                className="bg-accent h-12 rounded-none px-8 font-mono text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? 'Sending...' : 'Notify me'}
              </button>
            </form>
          ) : (
            <div className="border-accent/30 bg-accent/5 text-accent mt-8 border p-4 font-mono text-sm">
              {site.waitlist.success}
            </div>
          )}

          {error && <p className="mt-4 font-mono text-sm text-red-500">{error}</p>}
        </div>
      </div>
    </section>
  );
}
