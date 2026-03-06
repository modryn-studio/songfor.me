# Copilot Setup — How To Use

---

## Phase 1: New Project Setup

Run these once when starting a new project.

1. Create a blank repo on GitHub, then clone it locally
2. Clone this boilerplate into the project folder:
   ```powershell
   git clone https://github.com/modryn-studio/nextjs_boilerplate .
   ```
3. Re-point the remote to the new project repo:
   ```powershell
   git remote set-url origin https://github.com/modryn-studio/YOUR-REPO
   ```
4. Run `npm install`
5. Fill in `context.md` — product idea, target user, stack additions, routes, and this project's GitHub URL in Social Profiles
6. Fill in `brand.md` — voice, visual rules, emotional arc, and copy examples
7. Type `/init` — reads all three source docs, fills in `copilot-instructions.md` + `src/config/site.ts`
8. Drop your logomark at `public/brand/logomark.png` and type `/assets` — generates all favicons, OG image, and banner
9. Push to `main`

> After setup, **never edit `copilot-instructions.md` or `site.ts` directly**. Edit the source docs → run `/update`.

---

## Phase 2: While Building

This is the active development loop. No fixed order — use these as needed.

**Start the dev server**
`Ctrl+Shift+B` — starts the server and pipes output to `dev.log`. Tell Copilot **"check logs"** at any point to flag errors without pasting anything.

**Source docs changed?**
Edit `context.md` or `brand.md` → run `/update` immediately. Skipping this means Copilot works off stale context.

**Unsure if a package is current?**
Run `/deps` — validates all dependencies against live docs, surfaces breaking API changes.

**Register the tool on modrynstudio.com early**
Run `/tool` as soon as you have a homepage or hero built — even if the tool isn't functional yet. Use `status: "building"`. This puts it on the studio site immediately and starts building the URL footprint. Run it again at launch to flip to `status: "live"`.

**Write a build log entry**
Run `/log` any time something worth documenting ships — a working core feature, a key decision, a milestone. Don't save it for launch. Each post builds the public record and the SEO footprint while you're still building.

---

## Phase 3: Pre-Ship Checklist

Run these in order before going live. Each one builds on the last.

1. **`@check`** — quality gate. Scans for bugs, secrets, and code issues → auto-fixes what it can → runs lint + build → commits fixes. Never pushes.
2. **`/seo`** — auto-generates any missing SEO files, audits the codebase, walks through Search Console + Bing setup.
3. **`/launch`** — distribution checklist. Fixes sharing hooks, dynamic OG images, social footer links. Generates the last `/log` and `/tool` PRs if not already done.

---

## Phase 4: Ship It

1. Merge the open `/log` and `/tool` PRs on modryn-studio-v2 (the `/tool` PR should flip status to `live`)
2. Switch to **modryn-studio-v2** in VS Code, then run:
   - `/deploy` — adds the rewrite to `next.config.ts` wiring `modrynstudio.com/tools/[slug]/*` → this tool's Vercel URL
   - `/social` — generates launch copy (X, Reddit, shipordie) using v2 voice rules

> `/deploy` and `/social` are modryn-studio-v2 commands. They only work when modryn-studio-v2 is open in VS Code.

---

## Reference

### VS Code Modes

| Mode      | When to use                         | How                   |
| --------- | ----------------------------------- | --------------------- |
| **Ask**   | Quick questions about your codebase | Chat → select "Ask"   |
| **Plan**  | Blueprint a feature before building | Chat → select "Plan"  |
| **Agent** | Build, edit files, run commands     | Chat → select "Agent" |

Open chat: `Ctrl+Alt+I`

### All Slash Commands

| Command    | What it does                                                               | When                                    |
| ---------- | -------------------------------------------------------------------------- | --------------------------------------- |
| `/init`    | One-time setup: fills `copilot-instructions.md` + `site.ts` from source docs | Once, at project start               |
| `/update`  | Cascades edits from source docs into derived files                         | Any time `context.md` or `brand.md` changes |
| `/assets`  | Generates favicons, OG image, and banner from your logomark                | Once when logomark is ready; re-run after logomark changes |
| `/tool`    | Registers/updates this tool on modrynstudio.com via PR                    | Early (status: building) + at launch (status: live) |
| `/log`     | Drafts a build log post and opens a PR on modryn-studio-v2                | Any time something worth documenting ships |
| `/deps`    | Validates dependencies against live docs; flags version gaps + API changes | Any time you're questioning staleness   |
| `/seo`     | Pre-launch SEO audit + Search Console / Bing setup                         | Pre-launch, once                        |
| `/launch`  | Distribution checklist: sharing hooks, OG, social, community posting guide | Pre-launch, after `/seo`               |

> **modryn-studio-v2 only:** `/deploy` and `/social` exist only in that repo. Switch workspaces to run them.

### Brand Assets

Drop your logomark at `public/brand/logomark.png` (1024×1024, transparent background), then type `/assets`.

The script auto-detects whether your mark is colored or grayscale and generates the correct light/dark favicon pair.

**Optional overrides:**
- `public/brand/logomark-dark.png` — hand-crafted dark favicon (skips auto-inversion)
- `public/brand/banner.png` — 1280×320 README header (auto-generated if absent)

**What gets generated:**

| File                      | Purpose                          |
| ------------------------- | -------------------------------- |
| `public/icon-light.png`   | Favicon in light mode            |
| `public/icon-dark.png`    | Favicon in dark mode             |
| `public/icon.png`         | 1024×1024 for manifest + JSON-LD |
| `public/favicon.ico`      | Legacy fallback (48/32/16px)     |
| `src/app/apple-icon.png`  | iOS home screen icon             |
| `public/og-image.png`     | 1200×630 social card             |
| `public/brand/banner.png` | README header (if not provided)  |

Or run directly (requires [ImageMagick](https://imagemagick.org)):
```powershell
.\scripts\generate-assets.ps1
```

### Hooks

**Format on Save** — files are auto-formatted with Prettier on save. Requires the [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) (VS Code will prompt). Rules in `.prettierrc`.

### MCP Servers

- **GitHub** — create issues, PRs, manage repos from chat

### File Map

```
.github/
├── copilot-instructions.md        ← Always-on context (derived — edit source docs, not this)
├── instructions/
│   ├── nextjs.instructions.md     ← Auto-applied to .ts/.tsx files
│   └── seo.instructions.md        ← Auto-applied to .ts/.tsx files
├── agents/
│   └── check.agent.md             ← @check agent (pre-ship quality gate)
├── prompts/
│   ├── init.prompt.md             ← /init
│   ├── update.prompt.md           ← /update
│   ├── assets.prompt.md           ← /assets
│   ├── tool.prompt.md             ← /tool
│   ├── deps.prompt.md             ← /deps
│   ├── log.prompt.md              ← /log
│   ├── seo.prompt.md              ← /seo
│   └── launch.prompt.md           ← /launch
.vscode/
├── settings.json                  ← Agent mode, formatOnSave, Prettier default formatter
├── extensions.json                ← Recommends Prettier on first open
└── mcp.json                       ← MCP server config (GitHub)
src/config/
└── site.ts                        ← Derived — site name, URL, colors, social links (edit via /update)
src/lib/
├── cn.ts                          ← Tailwind class merge utility
├── route-logger.ts                ← API route logging (createRouteLogger)
└── analytics.ts                   ← GA4 event tracking (analytics.track)
scripts/
└── generate-assets.ps1            ← Asset generator (run via /assets)
context.md                         ← SOURCE OF TRUTH: product, stack, routes, monetization
brand.md                           ← SOURCE OF TRUTH: voice, visuals, user types, copy
development-principles.md          ← SOURCE OF TRUTH: product philosophy (permanent)
```

> Tip: `Configure Chat (gear icon) > Diagnostics` shows all loaded configs and errors.
