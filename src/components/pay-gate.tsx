'use client';

import { useState, useEffect } from 'react';
import { analytics } from '@/lib/analytics';

const RECEIPT_KEY = 'payment_receipt';

interface PayGateProps {
  /** Content shown to users who have paid */
  children: React.ReactNode;
  /** What the user gets — shown on the gate */
  valueProposition: string;
  /** Price display string, e.g. "$9" */
  price: string;
}

/**
 * Local-first pay gate.
 * Checks localStorage for a payment receipt. If found, renders children.
 * If not, shows a gate with a Stripe Checkout redirect button.
 *
 * After Stripe redirects back with ?paid=true, stores the receipt
 * in localStorage and reveals the content. No accounts, no database.
 */
export default function PayGate({ children, valueProposition, price }: PayGateProps) {
  const [hasPaid, setHasPaid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check localStorage for existing receipt
    const receipt = localStorage.getItem(RECEIPT_KEY);
    if (receipt) {
      setHasPaid(true);
      setChecking(false);
      return;
    }

    // Check URL params for return from Stripe
    const params = new URLSearchParams(window.location.search);
    if (params.get('paid') === 'true') {
      localStorage.setItem(RECEIPT_KEY, new Date().toISOString());
      setHasPaid(true);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    setChecking(false);
  }, []);

  const handleCheckout = async () => {
    setLoading(true);
    analytics.track('payment_gate', { action: 'checkout_click' });

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  };

  if (checking) return null;
  if (hasPaid) return <>{children}</>;

  return (
    <div className="mx-auto max-w-md border-2 border-[var(--color-border)] p-8 text-center">
      <h3 className="font-heading text-xl font-semibold">{valueProposition}</h3>
      <p className="mt-4 font-mono text-sm text-[var(--color-muted)]">
        One-time payment. No account required. Works instantly.
      </p>
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="mt-6 h-12 w-full rounded-none bg-[var(--color-accent)] px-8 font-mono text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Redirecting...' : `Pay ${price}`}
      </button>
    </div>
  );
}
