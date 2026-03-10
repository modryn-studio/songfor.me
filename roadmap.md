# Roadmap

## Phase 1 — MVP

**Done when:** one stranger pays $9.99 and receives a song they share.

- [x] Supabase: `orders`, `songs`, `emails` tables (`supabase/schema.sql`)
- [x] `/create` — Claude conversational intake (name → age → relationship → quirks → vibe → genre → email → Stripe)
- [x] `/api/intake` — Claude lyrics + Suno style generation → Supabase order → Stripe session
- [x] `/create/confirmed` — post-payment page with pulse animation
- [x] `/admin` — password-protected order dashboard: view intake, copy Suno style string, paste audio URL, send delivery email
- [x] `/api/admin/deliver` — creates song record, updates order, sends Resend delivery email
- [x] `/song/[id]` — public shareable song page with audio player, lyrics, share button
- [x] `src/emails/song-delivery.tsx` — React Email delivery template
- [x] `/privacy` + `/terms` pages

**Remaining to wire up (needs real env vars + Supabase project):**

- [ ] Create Supabase project → run `supabase/schema.sql`
- [ ] Set `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL`
- [ ] Create $9.99 product + price in Stripe Dashboard → copy Price ID to `STRIPE_PRICE_ID`
- [ ] Verify sending domain in Resend

---

## Phase 2 — First 10 orders

**Done when:** 10 paid orders, ≥5 from strangers.

- [ ] Collect 3 real reaction quotes → add to landing page as social proof
- [ ] Add "Ready in 15 minutes" above the fold on the landing hero
- [ ] Reddit launch: r/Gifts, r/Parenting (post as founder, lead with the story)
- [ ] Log post on modrynstudio.com

---

## Phase 3 — 100 orders

**Done when:** 100 paid orders, word-of-mouth detectable in traffic.

- [ ] pSEO: `/birthday-song-for-mom`, `/birthday-song-for-dad`, `/birthday-song-for-best-friend`, `/birthday-song-for-6-year-old`, `/birthday-song-for-teacher`
- [ ] Google Search Console + sitemap submitted
- [ ] Evaluate Suno API stability (watch for official API release)
- [ ] Evaluate: bundle pricing (3-pack), rush tier, add-on verse

---

## Deferred (GitHub issues)

- **Suno API** — no stable official API; manual V5 generation until one ships; adapter layer in `/lib/suno/` ready for swap
- **SMS/Twilio** — Resend email handles delivery for v1
- **Stripe webhooks** — not needed until server-side payment verification is required
- **Supabase Storage** — using audio URL paste for v1; add file upload when needed
- **Supabase Pro** — evaluate when free tier storage/egress becomes a constraint
