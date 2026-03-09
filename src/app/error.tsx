'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to error tracking when available
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="font-heading text-4xl font-semibold">Something went sideways.</h1>
      <p className="mt-4 text-muted">
        {error.message || 'An unexpected error occurred.'}
      </p>
      <button
        onClick={reset}
        className="mt-8 rounded-full bg-accent px-8 py-3 font-semibold text-white hover:opacity-90"
      >
        Try again
      </button>
    </main>
  );
}