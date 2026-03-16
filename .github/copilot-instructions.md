# songfor.me — Copilot Context

## Who I Am

I'm Luke Hanner — a solo founder building songfor.me, a personalized birthday song generator. Users complete a conversational intake (powered by Claude) that captures the recipient's name, quirks, inside jokes, and preferred vibe and genre. Claude generates custom lyrics and a Suno style string. Songs are manually generated on Suno V5 (concierge model) and delivered via a shareable song page with email notification. $9.99/song, delivered same day.

**Why it works:** A song is the only gift that lives inside someone. Not on a shelf — in their head. The birthday girl asks to hear it again before it's over. A 6-year-old still requests his song months later. Most gifts say "I was thinking of you." A personalized song says "I _know_ you." The purchase is often impulse — the product is the opposite of impulsive. It's the most specific, personal gift you can give, and it takes five minutes to order.

**Target user:** Impulse gifters — a mom, dad, or friend who just realized someone's birthday is today and wants to give something personal, not generic. "Impulse gifter" describes the distribution moment (when they buy). The deeper driver: they want to be the person who gave the gift everyone's still talking about. The song that plays at the party, stops the room, gets stuck in everyone's head.

**The methodology is the IP:** The founder has been making personalized songs for years. People started asking him to make songs for their own people — that accumulated demand made this a product. The system for drawing out personal details (inside jokes, memories, quirks) and translating them into lyrics that actually land is encoded in Claude system prompts at `/content/prompts/`.

## GitHub Repository

https://github.com/modryn-studio/songfor.me

## Deployment

<!-- Filled in by /setup from context.md.
     Read this before touching next.config.ts, BASE_PATH, site.ts, or any hardcoded URL.
     If mode is modryn-app:         basePath must stay set in next.config.ts.
     If mode is standalone-*:       basePath must be absent from next.config.ts. -->

mode: standalone-domain
url: https://songfor.gift
basePath:

## Stack

- Next.js 16 (App Router) with TypeScript
- React 19
- Tailwind CSS 4 for styling
- Stripe for one-time payments ($9.99/song)
- Resend for transactional email (song delivery, confirmations)
- Nodemailer for feedback/contact emails
- Lucide React for icons
- clsx + tailwind-merge for class utilities
- Vercel for deployment (Pro plan — commercial use)
- Vercel Analytics `<Analytics />` component in `layout.tsx` for pageviews — do not use their `track()` API
- Supabase (free tier) — Postgres DB for orders/songs queue (`orders`, `songs`, `emails` tables) and Storage for MP3s
- Claude API (Anthropic) — Model: `claude-opus-4-6` for conversational intake and lyrics/style string generation

## Project Structure

```
/app                    → Next.js App Router pages
/components             → Reusable UI components
/lib                    → Utilities, helpers, data fetching
/content/prompts/       → Claude system prompt templates (lyrics + style string generation)
/lib/suno/              → Future Suno API abstraction layer (adapter pattern)
/lib/queue/             → Order queue management utilities
/emails/                → React Email templates for Resend (song delivery, order confirmation)
```

## Route Map

- `/` → Landing page. Hero + single CTA ("Start their song →"). Email capture for non-buyers.
- `/create` → Conversational intake UI. Claude-powered chat collecting recipient details, quirks, vibe, genre.
- `/create/confirmed` → Post-payment confirmation. "Your song is being crafted" + confetti.
- `/song/[id]` → Public shareable song page. Audio player, lyrics, share buttons.
- `/admin` → Password-protected admin dashboard. View orders, upload MP3, mark done.
- `/privacy` → Privacy policy
- `/terms` → Terms of service

## Brand & Voice

**Voice:**

- Warm, celebratory, but never cheesy. Like a friend who gives great gifts, not a Hallmark card.
- Short sentences. Conversational. Reads like a text from someone who knows you.
- Confident about what it does ("this will make them cry happy tears") without overselling the tech.
- Never use: "AI-powered", "leverage", "revolutionary", "seamless", "unlock", "utilize", "cutting-edge", "game-changer"
- Never frame as last-minute or forgetful. The buyer is the thoughtful one — they saw an opportunity no one else would take. Frame: "You thought of something no one else would."

**Target User:** A mom scrolling her phone at 10pm realizing her kid's friend's birthday party is tomorrow and she forgot a gift. Or a 30-something who just saw their best friend's birthday post on Instagram and wants to do something that actually means something — not another gift card. Impulse gifters with good hearts and no time.

**Visual Rules:**

- Colors: Coral `#FF6B6B` (primary/CTAs/logomark), Gold `#FFD93D` (celebration moments only), Cream `#FFFAF5` (bg), Ink `#1C1410` (body text), Dusk `#9C8070` (muted/borders)
- Fonts: Inter (body) + Instrument Serif (headlines)
- Motion: Confetti on delivery, gentle pulse on waiting state — nothing else
- No dark mode (this is a gift — it should feel bright). No stock photos. No generic music note clipart.

**Emotional Arc:**

- Land: "Wait — I can make a real song for them? Right now?"
- Intake: "This is fun. It feels like I'm writing them a love letter."
- Waiting: "I can't wait to hear this. I hope it's good."
- Delivery: "Oh my god. This is so them. I'm sending this right now."
- Share: "Everyone needs to hear this. I'm posting this."

**Positioning:**

- What we are: The only birthday song generator that actually captures who someone is — their quirks, their jokes, their story.
- What we're not: Another form where you type a name and pick "rock" or "pop."
- One-liner: "Gift cards are forgettable. This isn't."

**Copy Reference:**

- Hero: "Make them a birthday song they'll never forget."
- Subhead: "Tell us about them. We'll write the lyrics, compose the music, and deliver a one-of-a-kind song in minutes."
- CTA: "Start their song →"
- Waiting: "Your song is being crafted with love and a little bit of magic ✨"
- Delivery email subject: "🎂 [Name]'s birthday song is ready!"
- Song page: "This song was made for [Name], because [they deserve something that's actually personal]."
- Footer: "Built by Luke. Because gift cards are boring."
- Error: "Something went sideways. Try again — [Name] is worth it."

**Social Proof (Pre-Launch):**

Use these real founder moments as landing page proof until buyer reviews accumulate. Format: the moment, not a star rating.

- "The first song I made — Monica turned 12. I played it at her party. Her mom started dancing when the hook hit. Monica laughed and went a little red. The room shifted."
- "A 6-year-old named Lincoln still asks for his song on every car ride. Months later."
- "She asked to hear it again before it was even over."

## README Standard

Every project README follows this exact structure — no more, no less:

```markdown
![Project Name](public/brand/banner.png)

# Project Name

One-line tagline. Outcome-focused — lead with what the user gets, not the technology.

→ [domain.com](https://domain.com)

---

Next.js · TypeScript · Tailwind CSS · Vercel
```

Rules:

- **Banner image** — always first. Path is `public/brand/banner.png`.
- **H1 title** — product name only, no subtitle.
- **Tagline** — one sentence. What the user gets. No buzzwords ("powerful", "seamless", "AI-powered").
- **Live link** — `→ [domain.com](https://domain.com)` format. Always present if live.
- **Divider** — `---` separator before the stack line.
- **Stack line** — `·`-separated list of core tech only. No version numbers, no descriptions.
- **Nothing else.** No install instructions, no contributing section, no architecture diagrams, no screenshots beyond the banner. Real docs go in `/docs` or on the live site.

When adding a badge row (optional, for open source tools/libraries only):

- Place it between the H1 and the tagline
- Use shields.io format: `[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)`
- Keep it to 3 badges max: typically license + CI status + live site
- Apps (not libraries) should skip badges entirely

## Tailwind v4

This project uses Tailwind CSS v4. The rules are different from v3 — follow these exactly.

**Design tokens live in `@theme`, not `:root`:**

```css
/* ✅ correct — generates text-accent, bg-surface, border-border, etc. */
@theme {
  --color-accent: #ff6b6b; /* Coral — CTAs, logomark, key UI moments */
  --color-secondary: #ffd93d; /* Gold — celebration moments only */
  --color-bg: #fffaf5; /* Cream — background base */
  --color-text: #1c1410; /* Ink — warm near-black body text */
  --color-muted: #9c8070; /* Dusk — secondary text, borders, placeholders */
  --color-surface: #ffffff;
  --color-border: #e8ded6; /* warm border */
  --font-heading: 'Instrument Serif', serif;
}

/* ❌ wrong — :root creates CSS variables but NO utility classes */
:root {
  --color-accent: #ff6b6b;
}
```

**Use `(--color-*)` shorthand in class strings — never `[var(--color-*)]`:**

```tsx
// ✅ correct — TW v4 native shorthand
<div className="border-(--color-border) bg-(--color-surface) text-(--color-muted)" />

// ❌ wrong — v3 bracket notation, verbose and unnecessary in v4
<div className="border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)]" />
```

If tokens are defined in `@theme`, you can also use the short utility names directly:

```tsx
// ✅ also correct when @theme is properly set up
<div className="border-border bg-surface text-muted text-accent" />
```

Never add `tailwind.config.*` — v4 has no config file. All theme customization goes in `globals.css` under `@theme`.

## API Route Logging

Every new API route (`app/api/**/route.ts`) MUST use `createRouteLogger` from `@/lib/route-logger`.

```typescript
import { createRouteLogger } from '@/lib/route-logger';
const log = createRouteLogger('my-route');

export async function POST(req: Request): Promise<Response> {
  const ctx = log.begin();
  try {
    log.info(ctx.reqId, 'Request received', {
      /* key fields */
    });
    // ... handler body ...
    return log.end(ctx, Response.json(result), {
      /* key result fields */
    });
  } catch (error) {
    log.err(ctx, error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

- `begin()` prints the `─` separator + START line with a 5-char `reqId`
- `info()` / `warn()` log mid-request milestones
- `end()` logs ✅ with elapsed ms and returns the response
- `err()` logs ❌ with elapsed ms
- Never use raw `console.log` in routes — always go through the logger

## Analytics

Vercel Analytics (`<Analytics />` in `layout.tsx`) handles pageviews automatically — no config needed.

For custom events, use `analytics` from `@/lib/analytics.ts`:

```typescript
import { analytics } from '@/lib/analytics';
analytics.track('event_name', { prop: value });
```

Add a named method to `analytics.ts` for each distinct user action. Named methods are typed and discoverable — no magic strings scattered across files.

**Vercel plan check required before adding custom events.** Custom events require Vercel Pro ($20/mo) — they do not appear in the Vercel Analytics dashboard on Hobby. Adding real event calls without an upgraded plan creates dead code that misleads future readers. Before instrumenting any new custom event: confirm the plan. If on Hobby, keep `analytics.ts` as a no-op stub until the plan is upgraded or a different provider is explicitly wired in. Do not add GA4 or PostHog without explicit instruction — keep it simple.

## Dev Server

Start with `Ctrl+Shift+B` (default build task). This runs:

```
npm run dev -- --port 3000 2>&1 | Tee-Object -FilePath dev.log
```

Tell Copilot **"check logs"** at any point — it reads `dev.log` and flags errors or slow requests.

## Code Style

- Write as a senior engineer: minimal surface area, obvious naming, no abstractions before they're needed
- Comments explain WHY, not what
- One file = one responsibility
- Prefer early returns for error handling
- Never break existing functionality when adding new features
- Leave TODO comments for post-launch polish items

## Core Rules

- Every page earns its place — no pages for businesses not yet running
- Ship fast, stay honest — empty is better than fake
- Ugly is acceptable, broken is not — polish the core action ruthlessly
- Ship one killer feature, not ten mediocre ones
- Instrument analytics before features — data from day one
- Onboard users to value in under 2 minutes
