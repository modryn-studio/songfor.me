---
name: init
description: Reads context.md, development-principles.md, and brand.md, then fills in copilot-instructions.md and site.ts for a new project
agent: agent
---

Read the following files from the workspace root:

1. `context.md` — project-specific facts: product name, what it does, who it's for, stack additions, and routes
2. `development-principles.md` — product philosophy to inform tone
3. `brand.md` — voice, visual rules, target user, emotional arc, and copy examples

Then edit `.github/copilot-instructions.md` and replace every `<!-- TODO -->` section with real content:

- **[Project Name]** — the product name from context.md
- **Who I Am** — 2–4 sentences: who Luke is, what the product does, who it's for. Use development-principles.md for tone (fast shipper, AI-assisted builder, micro-niche focus).
- **Stack** — read `package.json` as the source of truth: list only what is actually installed. Use context.md for planned/future additions and flag them as "not yet installed". Never list something as part of the stack if it isn't in `package.json`.
- **Project Structure** — keep `/app`, `/components`, `/lib`. Add any project-specific directories from context.md. Remove the `<!-- TODO -->` comment.
- **Route Map** — list every route from context.md with a one-line description. Always include `/privacy` and `/terms`.
- **Brand & Voice** — populate from brand.md: voice rules, visual rules (colors, fonts, motion), target user description, emotional arc, and copy examples to use as reference.
- **Tailwind v4 @theme example** — find the `<!-- TODO: update the @theme example below... -->` comment in copilot-instructions.md. Replace the placeholder color values in the `@theme { }` block immediately below it with the actual brand colors from `globals.css`. Update both the hex values and the inline comments (color name + role). Also update the `/* ❌ wrong */` `:root` example to use the real accent color.

Also fill in `src/config/site.ts` — replace every `TODO:` placeholder with real content from context.md and brand.md:

- `name` / `shortName` — product name from context.md
- `url` — from the **URL** section of context.md (use `https://` prefix). Extract the slug from the URL — it's the part after `/tools/`. **If the URL section is blank, do NOT guess — stop and tell Luke: "Fill in the URL field in context.md (e.g. https://modrynstudio.com/tools/your-slug)".**
- `description` — 110–160 char meta description that describes what the product does and who it's for
- `ogTitle` — 50–60 char title formatted as "Product Name | Short Value Prop"
- `ogDescription` — 110–160 char OG description, slightly more marketing-forward than the meta description
- `cta` -- short CTA button label (5--8 words) for the OG image pill; pull from brand's primary action or pricing copy (e.g. `'Get your plan for $9 \u2192'`, `'Start for free \u2192'`)
- `founder` — from context.md or default to "Luke Hanner"
- `accent` / `bg` — brand colors from brand.md (hex values)
- `social.twitter` / `social.twitterHandle` — X/Twitter profile URL and handle (e.g. `@lukehanner`) from the Social Profiles section of context.md
- `social.github` — GitHub URL from the Social Profiles section of context.md
- Any other social entries listed in context.md (e.g. `devto`, `shipordie`) — uncomment the corresponding lines in `site.social` and populate them

Do not modify any section without a `<!-- TODO -->` marker.
Do not add new sections.
Do not touch API Route Logging, Analytics, Dev Server, Code Style, or Core Rules.

---

## Set basePath in next.config.ts

Using the slug extracted from the URL field in context.md, update `next.config.ts`:

- Replace `TODO_SLUG` in `basePath` with the actual slug
- Example: if URL is `https://modrynstudio.com/tools/hiking-finder`, set `basePath: '/tools/hiking-finder'`
- If the URL field was blank (and you stopped to ask Luke), leave `TODO_SLUG` in place and flag it

---

## Wire EmailSignup Component

Check the `Monetization` section of `context.md`.

**If monetization is `email-only` or `one-time-payment`** (or if the section is blank — default to `email-only`):

- Check if `src/components/email-signup.tsx` exists. It should already be in the boilerplate.
- Wire it into the home page (`src/app/page.tsx`):
  - Add `import EmailSignup from '@/components/email-signup'` with the other imports
  - Add `<EmailSignup />` as a section on the page — typically after the hero/main content area, before the footer
- The component posts to `/api/feedback` with `type: 'newsletter'` — this route already exists in the boilerplate.

**If monetization is `none`**: skip email signup entirely.

---

## Wire Stripe (Conditional)

Check the `Monetization` section of `context.md`.

**If monetization is `one-time-payment`**:

### Option A: Payment Links (recommended — fastest)

No npm packages, no API routes, no env vars needed.

1. User creates a Payment Link at stripe.com → Payment Links
2. Set the Payment Link's success URL to the tool page with `?paid=true` appended (e.g. `https://modrynstudio.com/tools/[slug]?paid=true`)
3. Pass the Payment Link URL as the `checkoutUrl` prop on `<PayGate>`:
   ```tsx
   <PayGate
     checkoutUrl="https://buy.stripe.com/xxxxx"
     price="$9"
     valueProposition="Unlock full results"
   >
     {/* paid content */}
   </PayGate>
   ```
4. Verify `src/components/pay-gate.tsx` exists (should be in boilerplate)
5. Add `paymentGate` analytics event to `src/lib/analytics.ts`:
   ```ts
   paymentGate: (action: string) => track('payment_gate', { action }),
   ```

### Option B: Checkout Sessions (upgrade path)

Use when you need dynamic pricing, coupons, or programmatic control.

1. Install Stripe: run `npm install stripe` in the terminal
2. Verify `src/app/api/checkout/route.ts` exists (should be in boilerplate)
3. Verify `src/components/pay-gate.tsx` exists. Do NOT pass a `checkoutUrl` prop — it will fall back to the /api/checkout route automatically.
4. Check that `.env.local` has `STRIPE_SECRET_KEY` and `STRIPE_PRICE_ID` — if missing, warn the user to fill them in from stripe.com
5. Add `paymentGate` analytics event to `src/lib/analytics.ts`:
   ```ts
   paymentGate: (action: string) => track('payment_gate', { action }),
   ```

**If monetization is `email-only` or `none`**: skip Stripe entirely. Do not install any Stripe packages.

---

Finally, wire `FeedbackWidget` and analytics into `src/app/layout.tsx`:

- Add these imports at the top:
  ```tsx
  import { Analytics } from '@vercel/analytics/next';
  import { GoogleAnalytics } from '@next/third-parties/google';
  import FeedbackWidget from '@/components/feedback-widget';
  ```
- Add `<Analytics />` and `<FeedbackWidget />` as the last children inside `<body>`, before `</body>`
- Add `<GoogleAnalytics>` **outside** `<body>` but inside `<html>`, conditioned on the env var:
  ```tsx
  {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
    );
  }
  ```
  Do NOT use raw `<script>` tags for GA — `GoogleAnalytics` from `@next/third-parties/google` is the correct Next.js 15/16 approach.
- The widget uses CSS custom properties (`--color-border`, `--color-surface`, `--color-accent`, etc.).
  Verify these exist in `globals.css` inside an `@theme` block — **not** `:root`.
  If `globals.css` doesn't exist, create it with:

  ```css
  @import 'tailwindcss';

  @theme {
    --color-bg: #050505;
    --color-surface: #111111;
    --color-border: #222222;
    --color-text: #e5e5e5;
    --color-muted: #666666;
    --color-accent: #f97415; /* replace with brand accent from site.ts */
    --font-heading: var(--font-sans);
  }

  body {
    background-color: var(--color-bg);
    color: var(--color-text);
  }
  ```

  Colors must be in `@theme`, not `:root`. Only `@theme` generates Tailwind utility classes
  (e.g. `text-accent`, `bg-surface`, `border-border`). `:root` only creates CSS variables with
  no corresponding utilities.

- This must be present in every project — it's how Luke collects feedback from day one

---

## Generate Brand Palette

After globals.css is confirmed to have all 5 color tokens, run:

```powershell
.\scripts\generate-palette.ps1
```

This generates `public/brand/palette.png` — a visual swatch sheet of the brand colors.
No logomark needed. Run this now so the palette reference exists before design work begins.

If ImageMagick is not installed, tell Luke:

> "Install ImageMagick from https://imagemagick.org, then run `.\scripts\generate-palette.ps1` to generate your palette swatch sheet."

---

## Create .env.local

Check if `.env.local` already exists. If it does not:

- Run this command in the terminal:
  ```powershell
  Copy-Item .env.local.example .env.local
  ```
- All values will be blank. Flag each one Luke needs to fill in before the app will work:
  - `NEXT_PUBLIC_GA_MEASUREMENT_ID` — from Google Analytics → Admin → Data Streams
  - `GMAIL_USER` / `GMAIL_APP_PASSWORD` — Gmail address + App Password (not account password)
  - `RESEND_API_KEY` / `RESEND_SEGMENT_ID` — from resend.com → API Keys / Segments
  - `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` / `STRIPE_PRICE_ID` — from stripe.com → Developers → API Keys (only if monetization is `one-time-payment`)

If `.env.local` already exists, skip this step.

---

After editing, confirm what was filled in and flag anything that was missing from context.md or brand.md that Luke should provide.
