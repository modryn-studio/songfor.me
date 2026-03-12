# Project Context

## Philosophy

A song is the only gift that lives inside someone.

Not on a shelf. Not in a drawer. It gets replayed. The birthday girl asks to hear it again before it's even over. A 6-year-old demands it on every car ride months later. A stepdaughter still sings a track made for a family friend — out of nowhere, in the kitchen, years later. These songs don't expire. They don't get returned. They get stuck in people's heads because they're _about_ someone the listener loves.

Most gifts say "I was thinking of you." A personalized song says "I _know_ you." The inside joke. The thing they always say. The memory only that room would recognize. A gift card puts a dollar value on the relationship. A song captures who the person actually is.

The impulse gifter framing (below) describes _when_ people buy. This is _why the product works_. Those are different things. The purchase is often impulse — the product is the opposite of impulsive. It's the most specific, personal gift you can give, and it takes five minutes to order.

## Product

songfor.me — A personalized birthday song generator. Users complete a conversational intake (powered by Claude) that captures the recipient's name, age, relationship, personality quirks, inside jokes, and preferred vibe/genre. Claude generates custom lyrics and a Suno style string. Songs are manually generated on Suno V5's web app (concierge model) and delivered via a unique shareable song page with email notification. The core promise: from impulse to sent gift in under 5 minutes of user effort, song delivered in ~15 minutes.

The core competitive advantage is the founder's battle-tested prompting system — the methodology for translating personal details (personality quirks, inside jokes, memories, relationship dynamics) into lyrics + Suno style strings that produce emotionally resonant songs. This is the IP. Competitors ask for a name and genre. songfor.me captures stories. The prompt system is encoded in Claude system prompts stored in `/content/prompts/`.

## Target User

A mom, dad, or friend who just realized someone's birthday is today (or tomorrow) and wants to give something personal, not generic. They're not planners — they're impulse gifters scrolling their phone. They'll pay $9.99 to avoid being the person who sends a gift card. They want the gift to feel like they put thought into it, even though they just remembered 20 minutes ago.

Note: "impulse gifter" is the distribution moment — _when_ the purchase happens. The deeper driver is wanting to be the person who gave the gift everyone's still talking about. The song that plays at the party, stops the room, gets stuck in everyone's head. That's what they're actually buying.

## Origin Story

The founder has been making personalized birthday songs for family and friends for years using Suno. The first was for his wife's best friend's daughter (Monica, turning 12) — played it at her party, the room shifted, her mom started dancing when the hook hit (_"Monica Monica, it's your day..."_), Monica laughed and went a little red. A 6-year-old named Lincoln (another family friend's son) still asks to hear his song months later. The founder's stepdaughter still sings a track he made for a family friend's boyfriend.

People started asking him to make songs for their own people. That accumulated demand — combined with his optimized prompting methodology — is what made this a product. The methodology is the IP: the system for drawing out personal details (inside jokes, memories, quirks) and translating them into lyrics that actually land.

---

## Deployment

mode: standalone-domain
url: https://songfor.gift
basePath:

Note: songfor.me is a standalone domain — it earns this exception per the domain strategy because it's a B2C gifting brand where the URL is part of the emotional product experience. "modrynstudio.com/tools/songfor" kills the magic. Still wired into shared Resend email list (segmented as "songfor") and shared GA4 analytics.

Google Search Console: Set up a new Domain property for songfor.me (separate from modrynstudio.com). Submit sitemap after initial deploy.

## Stack Additions

- **Supabase** (free tier) — Postgres DB for song orders (queue), song metadata, email capture. Tables: `orders`, `songs`, `emails`. Free tier: 500 MB storage, 50K MAUs, 1 GB file storage (for MP3s). Note: free tier pauses after 7 days of inactivity — keep active with a cron ping or upgrade to Pro ($25/mo) once revenue justifies it.
- **Supabase Storage** — MP3 file hosting. Each song ~4-6 MB. Free tier gives 1 GB = ~200 songs before needing to upgrade. Monitor egress: 2 GB free. Each song play/download is ~5 MB, so ~400 plays/month free. Upgrade to Pro when this becomes a constraint.
- **Resend** (free tier) — Transactional email for song delivery notifications and email capture confirmations. Free tier: 3,000 emails/month, 100/day. Shared Resend account with other modryn studio tools, segmented as "songfor". One verified domain: songfor.me.
- **Stripe** — One-time payment of $9.99/song. Start with Payment Links (zero server code). Create one Payment Link in Stripe Dashboard. Upgrade to Checkout Sessions only when dynamic pricing, bundles, or coupons are needed. Disable Cash App Pay in Dashboard → Settings → Payment methods.
- **Claude API (Anthropic)** — Model: Claude Opus 4.6 (anthropic/claude-opus-4-6). Powers the conversational intake and generates: (1) structured lyrics with verses/chorus/bridge, (2) a Suno V5 style string (genre, tempo, instrumentation, mood tags). System prompt encodes the founder's battle-tested prompting methodology.
- **Vercel** — Deployment. NOTE: Vercel Hobby plan prohibits commercial use. Must use Vercel Pro ($20/mo) since this product charges money. Budget this from day one.

**Services NOT in v1 (GitHub issues for later):**

- Twilio (SMS notifications — use Resend email for v1 delivery)
- Suno API (no official API exists; unofficial third-party wrappers are unstable — GoAPI and PiAPI both shut down recently. Manual generation on Suno V5 web app for v1. Build API abstraction layer as a GitHub issue so when a stable API exists, swap is a config change.)
- Vercel KV (not needed — Supabase handles all data persistence)

## Suno Context (as of March 2026)

Current model: **Suno V5** (released September 2025). Key capabilities relevant to this product:

- Studio-grade audio fidelity with convincingly human vocals
- 10x faster processing vs V4.5
- Intelligent Arrangement Engine: auto-structures compositions with verses, choruses, bridges, outros
- Suno Studio: audio workstation for deconstructing songs into stems (vocals, drums, bass, etc.), exportable as MIDI
- ELO benchmark score of 1,293 — highest in the space for audio fidelity, structure, and vocal realism

Previous versions (for reference if encountering legacy content):

- V4 (Nov 2024) — 4-min max, Cover + Persona features
- V4.5 (May 2025) — 8-min max, improved prompt adherence
- V4.5+ (July 2025) — Add Vocals, Add Instrumentals, Inspire features

**API Status:** No official public API exists. Suno remains consumer-first (web app + Studio). Unofficial third-party wrappers are unstable — GoAPI and PiAPI both shut down recently. Remaining providers (sunoapi.org, EvoLink, AIML API, sunor.cc) could disappear at any time. Suno has raised $125M+ in funding and has 12M+ users — an official API is likely coming but no timeline is confirmed.

**Legal note:** Suno (and rival Udio) were sued by major labels in June 2024 for alleged copyright infringement in training data. Both companies argue fair use. The legal landscape is unsettled. Birthday songs as personal gifts are the lowest-risk category for commercial use. Monitor developments before scaling to high-volume commercial use.

## Project Structure Additions

- `/content/prompts/` — Claude system prompt templates (lyrics generation, style string generation)
- `/lib/suno/` — Future API abstraction layer (adapter pattern: provider-agnostic interface so swapping sunoapi.org → official Suno API → any provider is one config change)
- `/lib/queue/` — Order queue management utilities (status: pending → generating → done → delivered)
- `/emails/` — React Email templates for Resend (song delivery, order confirmation)

## Route Map

- `/` → Landing page. Hero + single CTA ("Start their song →"). Email capture for non-buyers.
- `/create` → Conversational intake UI. Claude-powered chat (NOT a static form — this is a key differentiator). Collects: recipient name, age, relationship to buyer, 3 personality facts/quirks/inside jokes (things that are "so them" — hobbies, phrases they say, running jokes, memories), vibe (roast / heartfelt / hype / kids bop), genre preference (or "what genre feels like them?"). The conversational format makes the intake feel like writing a love letter, not filling out a form. Ends with order summary + Stripe Payment Link redirect.
- `/create/confirmed` → Post-payment confirmation. "Your song is being crafted ✨ We'll email you at [email] in ~15 minutes." Confetti animation. Share-the-anticipation CTA.
- `/song/[id]` → Public shareable song page. Audio player, lyrics display, recipient name, share buttons (copy link, text, social). This is the gift URL that gets forwarded to the birthday person.
- `/admin` → Password-protected admin dashboard (for founder only). View pending orders, upload MP3, paste lyrics, mark order as done (triggers Resend delivery email). Simple table UI. This is the manual fulfillment interface.
- `/privacy` → Auto-generated.
- `/terms` → Auto-generated.

## Minimum Money Loop

The minimum sequence that results in money changing hands. Wire every step end-to-end before polishing any individual step. One real order through the whole system is the only milestone that matters in Phase 4.

```
Landing page (leave it) →
/create intake (Claude) →
Stripe checkout ($9.99) →
Admin sees new order →
Admin uploads MP3 →
Resend email to buyer →
/song/[id] shareable page
```

**Infrastructure status (2026-03-12):** ✅ Supabase schema run · ✅ `songs` storage bucket created (public) · ✅ All env vars set in Vercel (all environments). Loop is fully wired and ready for end-to-end testing.

**Rule:** Do not polish any one piece until this loop has run once with a real order.

## Product North Star

"Send the Moment" — A birthday song triggered by a memory or impulse.

Someone sees a photo, gets a calendar reminder, scrolls past a birthday post → taps "Make a song about this" → 90-second intake → "Your song will be ready soon, we'll email you" → they go about their day → song arrives → they forward the shareable link directly to the birthday person.

The speed problem isn't "generate in 10 seconds." It's "from impulse to committed gift in under 5 minutes of user effort." The generation happens async. The sending feels instant. The delivery IS the gift — a song landing in someone's inbox or iMessage on their birthday.

## Monetization

one-time-payment

- Price: $9.99/song
- Method: Stripe Payment Link (created in Stripe Dashboard, no server code)
- Flow: User completes intake → sees order summary → clicks "Pay $9.99" → redirected to Stripe Payment Link → success redirect back to `/create/confirmed`
- Email capture is built into the payment flow (Stripe collects it) AND into the intake flow (required for delivery). Non-buyers who abandon get a "notify me" email capture on the landing page.
- Future pricing experiments (GitHub issues): $14.99 3-pack bundle, $19.99 "rush" 5-minute delivery (when API exists), $4.99 "re-sing" (same lyrics, different genre)

## Target Subreddits

Reddit is hostile to AI product promotion. Existing posts about AI birthday song tools get downvoted and called "AI slop." The strategy must be story-first, never product-first. Lead with the emotional outcome, not the tool.

**Approach: Organic storytelling, not product drops.** Post about the reaction, not the product. "I surprised my dad with a personalized birthday song and he cried" → people ask "how?" → you answer in comments. Never lead with the URL.

- \*\*\* r/CasualConversation — PRIMARY. Wholesome stories land well here. "I made my friend cry with a birthday song" format. High engagement, low spam suspicion.
- r/Mommit (555K weekly visitors) — Story-driven: "My kid has been singing his birthday song for 3 days straight." Moms share emotional moments organically. Never pitch — just share the moment.
- r/Parenting (1.3M weekly visitors) — Same approach. "How I solved the last-minute birthday gift problem" as genuine advice, not promotion.
- \*\*\*\* r/GiftIdeas (54K weekly visitors) — CAUTION. This sub actively downvotes AI product posts. Only engage by answering existing "looking for unique gift" threads in comments, never as a top-level post.

**Anti-pattern:** Do NOT post "I built a tool that makes birthday songs" — this gets flagged as self-promotion and downvoted immediately (validated by existing posts getting 0 upvotes and "Ew no thanks" responses).

## Social Profiles

- X/Twitter: https://x.com/lukehanner
- GitHub: https://github.com/TODO
- Dev.to: https://dev.to/lukehanner
- Ship or Die: https://shipordie.club/lukehanner

---

## Key Decisions Log

1. **Manual concierge model for v1.** Founder generates songs on Suno V5 web app manually. No API dependency. Cap at 5-10 orders/day. This is premium positioning, not a limitation.
2. **Email delivery, not SMS.** Resend is free (3,000/mo). Twilio SMS costs ~$0.01/msg + $1.15/mo for a number + carrier fees + A2P registration complexity. SMS is a future enhancement.
3. **Standalone domain (songfor.me) over modrynstudio.com/tools/songfor.** The URL is part of the product. "This song is for me?" — emotional resonance that a subdirectory can't deliver.
4. **Supabase over Vercel KV.** Need relational data (orders, songs, emails), file storage (MP3s), and row-level queries (admin dashboard). KV is too simple. Supabase free tier covers early scale.
5. **Vercel Pro required.** Hobby plan prohibits commercial use. $20/mo is a cost of doing business from day one.
6. **No Suno API dependency in v1.** Official API doesn't exist. Unofficial wrappers are unstable (GoAPI and PiAPI both recently shut down). Build the abstraction layer interface but implement manual fulfillment behind it. When a stable API emerges, swap the implementation without changing the product.
7. **Impulse purchase UX truth.** Birthday songs are zero-lead-time purchases. The product must feel instant to the buyer (intake < 2 min), even though generation is async (~15 min). The submit moment must feel like the gift is already on its way.
8. **Price at $9.99.** High enough to filter freeloaders, low enough for impulse buy. Aligns with Tier 2 monetization strategy. Raise price when demand exceeds manual fulfillment capacity.
9. **Data collection from day one.** Log every generation: intake inputs, Claude outputs (lyrics + style string), Suno parameters, which songs get shared/played. This is the training data flywheel for the prompt system. When automation arrives, this data determines what inputs → great outputs.
10. **pSEO pages are month-2+ play.** Templates: "birthday song for [relationship]", "personalized [genre] birthday song", "birthday song generator for [age]". Don't build during v1 sprint. Plant seeds after launch.
11. **Price is the demand lever.** When manual fulfillment capacity is exceeded, raise the price ($9.99 → $14.99 → $24.99). Don't hire or build faster — charge more. Demand tells you where the ceiling is. This is the concierge model's built-in scaling mechanism.
12. **Competition validates the market — and the gap is real.** Songful ($49/song, 2,400+ reviews, 4.97 stars) is the market leader — proof that people pay real money for personalized songs and cry happy tears when they receive them. BirthdaySongMaker ($9.99/song) is the budget player, heavy on SEO, light on personalization. CustomBdaySong ($4/song) is the indie entry with weak brand. SendFame (1M+ users) is a general AI content platform, not birthday-specific. All competitors use form-based intake: name, genre, occasion, done. None do conversational intake. None capture the story — the quirks, the inside jokes, the "things that are so them." The moat is prompt depth + founder's prompting methodology, not technology. Think Pepsi vs Coke: Songful is the premium incumbent. songfor.me is the faster, more personal, more accessible challenger at 1/5 the price with deeper personalization. Competition means the market is proven — not that it's closed.
13. **Data flywheel instrumentation.** Log every generation from day one: full intake inputs, Claude system prompt version used, Claude output (lyrics + style string), Suno parameters used, generation time, whether the song was downloaded, whether the shareable link was visited (and how many times), and any qualitative feedback. Over time this reveals patterns: "roast songs for dads over 50 work best in country/folk", "kids songs need BPM 90-110 and simple rhymes." This data is the moat that compounds.
14. **No lyric approval step.** The buyer doesn't tell the chef what ingredients to use. The conversational intake captures enough personal detail that the lyrics should land without editing. If they don't, the intake failed — fix the intake, not the output. A lyric review step also breaks the impulse flow: the user is done after payment. They go about their day, song arrives, they forward it. Adding friction after payment contradicts the product's core promise. Songful needs lyric approval because their form-based intake produces thin, generic output. Ours shouldn't.

## GitHub Issues Parking Lot

These are captured but NOT part of v1. Do not build any of these until the core flow (intake → pay → generate → deliver → share) is live with real paying users.

## Expansion Path (micro → multi-niche)

Per development principles: dominate one niche completely before expanding.

1. **Birthdays** → nail it (v1, current focus)
2. **Anniversaries, graduations, retirements** → same engine, different occasion prompts
3. **B2B: Corporate gifting** → companies using personalized songs for clients/employees
4. **White-label** → event planners, party supply brands

Do NOT start Phase 2 until birthdays are generating consistent revenue and the prompt system is proven with data.

- [ ] Stripe Checkout Sessions (dynamic pricing, coupons, bundles)
- [ ] Suno API abstraction layer design (adapter pattern: define interface now, implement manual fulfillment behind it, swap to real API later with one config change)
- [ ] Auto-generation when stable Suno API exists
- [ ] SMS notifications via Twilio (in addition to email)
- [ ] Lyric video export (ffmpeg + audio + text overlay)
- [ ] Shareable gift card wrapping UI (custom message around the song link)
- [ ] Occasions beyond birthdays (anniversaries, graduations, retirements, weddings)
- [ ] B2B / corporate gifting / white label
- [ ] User accounts + order history
- [ ] pSEO pages ("birthday song for dad", "personalized kids birthday song", "funny birthday song generator")
- [ ] Admin dashboard upgrades (analytics, queue priority, batch operations)
- [ ] Suno Studio integration (stems, Add Vocals, Add Instrumentals)
- [ ] Song preview before payment (30-second instrumental teaser generated from style string — reduces refund risk)
- [ ] Referral system ("Share songfor.me, get $3 off your next song")
- [ ] Webhook-based Stripe verification (server-side payment confirmation)
- [ ] Re-sing feature ($4.99 — same lyrics, different genre)
- [ ] Rush delivery tier ($19.99 — 5-minute delivery when API exists)
- [ ] 3-pack bundle ($14.99 — buy 3 songs at a discount)
- [ ] A/B test landing page copy (hero variants, price sensitivity)
- [ ] Supabase free tier keep-alive cron (prevent 7-day inactivity pause)
- [ ] "Surprise delivery" link — send directly to the birthday person with a custom unwrapping experience
- [ ] Occasion expansion: anniversaries, graduations, retirements, weddings (same engine, different occasion prompts)
- [ ] B2B corporate gifting (one client posting on LinkedIn generated 5 new leads — from research)
- [ ] White-label for event planners / party supply brands
- [ ] Competitive elements / gamification (e.g. "most-played song of the week" leaderboard)
- [ ] Async delivery pattern as reusable boilerplate for other modryn studio tools (new tool type: jobs that take minutes, not milliseconds, requiring queue + delivery mechanism + persistent output page + status polling)
