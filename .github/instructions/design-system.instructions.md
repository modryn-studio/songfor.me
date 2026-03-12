---
applyTo: '**/*.tsx'
---

# Design System

## Shared UI Primitives

All interactive elements use primitives from `src/components/ui/`. Never write raw `<button>`, `<input>`, or `<textarea>` — import and use the shared components.

```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
```

**Button variants:** `primary` (default, filled accent) | `secondary` (outlined, accent on hover) | `ghost` (text-only)
**Button sizes:** `sm` | `md` (default) | `lg`

All buttons default to `type="button"`. Pass `type="submit"` explicitly for form submissions.

**Shape is always the caller's job — never set `rounded-*` inside a primitive.**
The primitives own structure and token contracts. Shape is a brand decision that belongs in the component using the primitive, not inside it.

The rule: if every caller is overriding the same base class, the base class is wrong.

```tsx
// ✅ correct — shape set at the call site, primitive stays neutral
<Button className="rounded-none px-6">Submit</Button>
<Input className="rounded-lg" />

// ❌ wrong — never add rounded-* to button.tsx / input.tsx / textarea.tsx base classes
```

Exception: intentionally non-standard shapes (circular icon buttons, custom media controls) — these stay as raw `<button>` elements and should be noted in a comment.

---

## Brand Tokens

Use named utilities generated from `@theme` in `globals.css`. Never use `[var(--color-*)]` arbitrary syntax.

```tsx
// ✅ correct
<div className="bg-accent text-white border-border bg-surface text-muted" />

// ❌ wrong — verbose, not idiomatic TW v4
<div className="bg-[var(--color-accent)] border-[var(--color-border)]" />
```

Core tokens: `bg-accent`, `bg-bg`, `bg-surface`, `border-border`, `text-text`, `text-muted`, `text-accent`, `bg-secondary`

---

## Responsive Patterns

Page-level horizontal padding: `px-4 sm:px-6` — never `px-6` alone (mobile gets no breathing room).
Vertical section spacing: `py-12 sm:py-16` or `py-16 sm:py-20`.
Body text: `text-[15px] sm:text-base` or `text-sm sm:text-base` on dense copy blocks.

---

## Mobile Keyboard Safety

Any panel with text input that is `fixed` or `sticky` at the bottom of the screen must track the on-screen keyboard using `window.visualViewport`. Without this, the keyboard covers the input on iOS/Android.

```tsx
const [keyboardOffset, setKeyboardOffset] = useState(0);

useEffect(() => {
  if (typeof window === 'undefined' || !window.visualViewport) return;
  const vp = window.visualViewport;
  const update = () => {
    const offset = Math.max(0, window.innerHeight - vp.height - vp.offsetTop);
    setKeyboardOffset(offset > 120 ? offset : 0); // ignore browser chrome jitter
  };
  update();
  vp.addEventListener('resize', update);
  vp.addEventListener('scroll', update);
  return () => {
    vp.removeEventListener('resize', update);
    vp.removeEventListener('scroll', update);
  };
}, []);

// Apply to the fixed wrapper — style= is needed because Tailwind can't handle dynamic values:
<div className="fixed inset-x-0 bottom-0" style={{ bottom: keyboardOffset }}>
  <div className="pb-[calc(1rem+env(safe-area-inset-bottom))]">{/* inputs here */}</div>
</div>;
```

---

## Touch Targets

All tappable elements must be at least 44×44px. Primary action buttons: `h-12`. Secondary buttons: `min-h-11`. Never use `py-1` or `h-8` on mobile-visible buttons.

---

## Class Merging

Use `cn()` from `@/lib/cn` when combining base classes with conditional or override classes:

```tsx
import { cn } from '@/lib/cn';
<div className={cn('base-classes', condition && 'conditional-class', className)} />;
```
