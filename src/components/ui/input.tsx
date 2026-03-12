import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        'border-border bg-surface placeholder:text-muted focus:border-accent focus-visible:ring-accent/20 w-full rounded-full border px-4 py-3 text-sm transition-colors outline-none focus-visible:ring-2',
        className
      )}
      {...props}
    />
  );
});

Input.displayName = 'Input';
