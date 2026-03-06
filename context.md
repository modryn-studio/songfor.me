# Project Context

## Product
<!-- What is this product? One or two sentences. -->

## Target User
<!-- Who is it for? Be specific — describe one real person, not a demographic. -->

## Deployment
<!-- How is this project served? Pick one mode and fill in the three fields below.

     MODE: modryn-app
     Served at modrynstudio.com/tools/[slug] via rewrites in modryn-studio-v2.
     This repo deploys to Vercel (.vercel.app URL). modryn-studio-v2 proxies
     modrynstudio.com/tools/[slug]/* to it. Google sees one domain — good for SEO.
     → basePath: '/tools/your-slug' in next.config.ts
     → BASE_PATH = '/tools/your-slug' in src/lib/base-path.ts

     MODE: standalone-subdomain
     Served at subdomain.domain.com — its own Vercel deployment + custom subdomain DNS.
     → Remove basePath from next.config.ts entirely
     → BASE_PATH = '' in src/lib/base-path.ts

     MODE: standalone-domain
     Served at its own root domain (e.g. specifythat.com).
     → Remove basePath from next.config.ts entirely
     → BASE_PATH = '' in src/lib/base-path.ts
-->

mode: <!-- modryn-app | standalone-subdomain | standalone-domain -->

modrynstudio.com has a verified **Domain property** in Google Search Console. All tools under that domain are covered automatically. Never walk through domain verification steps  just submit the tool sitemap to the existing property.
url:  <!-- https://modrynstudio.com/tools/your-slug -->
basePath: <!-- /tools/your-slug   (leave empty for standalone modes) -->

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

