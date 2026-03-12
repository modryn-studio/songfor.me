import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'border-border bg-surface placeholder:text-muted focus:border-accent focus-visible:ring-accent/20 w-full resize-none rounded-2xl border px-4 py-3 text-sm transition-colors outline-none focus-visible:ring-2',
        className
      )}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';
