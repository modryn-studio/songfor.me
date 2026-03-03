# Project Context

## Product
<!-- What is this product? One or two sentences. -->

## Target User
<!-- Who is it for? Be specific — describe one real person, not a demographic. -->

## URL
<!-- The deployed URL for this tool.
     All tools live on a subdomain of modrynstudio.com — no separate domain purchase needed.
     Format: toolname.modrynstudio.com
     Example: hiking-finder.modrynstudio.com
     Exception: pre-existing brands with their own domain (e.g. specifythat.com). -->

## Stack Additions
<!-- Any services beyond the boilerplate defaults (Next.js, Tailwind, Vercel, GA4)?
     e.g. Resend for email, Stripe for payments, Prisma + Supabase for database -->

## Project Structure Additions
<!-- Any directories beyond /app, /components, /lib?
     e.g. /content/posts/*.mdx, /content/tools/*.json -->

## Route Map
<!-- List every route and what it does.
     /privacy and /terms will be added automatically.
     Example: - `/dashboard` → Main user dashboard after login -->
- `/` →

## Monetization
<!-- How does this product make money? Pick one:
     - `email-only`        → Free tool, capture emails for future launches (default)
     - `one-time-payment`  → Pay once, use forever (Stripe)
     - `none`              → No email capture, no payment — pure SEO/traffic play

     If `one-time-payment`:
       Fast path (default): create a Payment Link in Stripe Dashboard, pass URL to <PayGate>.
       No server code, no env vars, no npm package.
       Upgrade path: /api/checkout route for dynamic pricing (needs `stripe` npm + env vars). -->

## Target Subreddits
<!-- Subreddits where the target user's pain lives.
     Used by /social prompt for launch-day distribution.
     List 2–4. Don't include r/SideProject (always included as founder channel).
     Example: r/webdev, r/freelance -->

## Social Profiles
<!-- Your accounts — used by /init and /launch to populate site.ts social block and footer links.
     twitter/devto/shipordie are universal — already filled in.
     Update GitHub to this project's repo URL. -->
- X/Twitter: https://x.com/lukehanner
- GitHub: https://github.com/TODO
- Dev.to: https://dev.to/lukehanner
- Ship or Die: https://shipordie.club/lukehanner
