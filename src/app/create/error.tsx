'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="font-heading text-3xl font-semibold">Something went sideways.</h1>
      <p className="text-muted mt-4">{error.message || 'An unexpected error occurred.'}</p>
      <Button onClick={reset} className="mt-8">
        Try again
      </Button>
    </main>
  );
}