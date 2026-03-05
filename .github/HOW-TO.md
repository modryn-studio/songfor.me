# Copilot Setup — How To Use

## New Next.js Project Setup

1. Create a blank repo on GitHub, then clone it locally
2. Clone this repo into the project folder:
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
7. Type `/init` — Copilot reads all three files and fills in `.github/copilot-instructions.md` + `src/config/site.ts`
8. Drop your logomark at `public/brand/logomark.png` and type `/assets`
9. Push to `main` — you're live on the new repo

---

## Modes (built into VS Code)

| Mode      | When to use                         | How                   |
| --------- | ----------------------------------- | --------------------- |
| **Ask**   | Quick questions about your codebase | Chat → select "Ask"   |
| **Plan**  | Blueprint a feature before building | Chat → select "Plan"  |
| **Agent** | Build, edit files, run commands     | Chat → select "Agent" |

Open chat: `Ctrl+Alt+I`

## Custom Agent

**`@check`** — Pre-ship quality gate. Checks for bugs → scans → fixes → lints → builds → commits. Never pushes.

Usage: switch to Agent mode, then type:

```
@check
```

## Slash Commands

**`/init`** — New project setup. Reads `context.md` + `brand.md` + `development-principles.md` and fills in the TODO sections of `copilot-instructions.md` and `src/config/site.ts`. Run this **once at the start of every new project**. Do not re-run it after setup — use `/update` instead.

**`/update`** — Cascade source doc changes. Run this any time you edit `context.md` or `brand.md` after `/init` has already run. Re-reads all three source files and updates the derived files that are out of sync: `copilot-instructions.md`, `src/config/site.ts`, `next.config.ts`. Does not re-run setup steps (component wiring, Stripe, etc.).

**`/tool`** — Register this project as a tool on modrynstudio.com. Opens a PR on `modryn-studio/modryn-studio-v2` with the tool JSON. Run it when you add the tool and again when you ship (to flip status to `live`, add URL, screenshot, and launch date).

**`/log`** — Draft a build log post for modrynstudio.com. Reads recent commits from this repo, asks for context, then opens a PR on `modryn-studio/modryn-studio-v2` with a draft MDX post. Fill in the TODOs, merge to publish.

**`/deps`** — Validate all dependencies against live documentation. Checks version gaps AND API pattern changes. Web searches changelogs and migration guides for every key package, then shows two tables: version status + breaking API changes to know about. Run this any time you're unsure if I'm building with current patterns.

**`/assets`** — Generate all favicons, icons, OG image, and README banner from your logomark. Checks prerequisites (logomark exists, ImageMagick installed), runs the generator, and commits the output.

**`/seo`** — Pre-launch SEO checklist. Auto-generates missing SEO files, then walks you through Google Search Console, Bing, and OG validation.

**`/launch`** — Distribution checklist. Run after `/seo`. Audits and fixes sharing hooks, social footer links, dynamic OG images, and FAQPage schema. Then walks you through the launch day posting sequence: build log → Ship or Die → X → dev.to → HN → Reddit → Product Hunt (optional).

**When to run each command:**

| Command   | When                                                  |
| --------- | ----------------------------------------------------- |
| `/init`   | Once, at project start                                |
| `/update` | Any time source docs change                           |
| `/deps`   | Any time you're questioning staleness                 |
| `/assets` | Once, when logomark is ready                          |
| `/tool`   | Twice: at start (register) + at launch (flip to live) |
| `/log`    | Any time you want to write a build post               |
| `/seo`    | Pre-launch, once                                      |
| `/launch` | Pre-launch, after `/seo`                              |

Usage: type any slash command in chat.

> **modryn-studio-v2 commands** — `/deploy` and `/social` only exist in the modryn-studio-v2 repo. Switch to that workspace to run them (see Launch Sequence below).

## Hooks (auto-runs after edits)

**Format on Save** — Files are automatically formatted with Prettier whenever you save.

Configured via `editor.formatOnSave: true` in `.vscode/settings.json`. Requires the [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) extension (VS Code will prompt you to install it — it's listed in `.vscode/extensions.json`). Formatting rules live in `.prettierrc`.

## MCP Servers

- **GitHub** — create issues, PRs, manage repos from chat

## File Map

```
.github/
├── copilot-instructions.md        ← Always-on context (edit per project)
├── instructions/
│   ├── nextjs.instructions.md    ← Auto-applied to .ts/.tsx files
│   └── seo.instructions.md        ← Auto-applied to .ts/.tsx files
├── agents/
│   └── check.agent.md             ← @check agent (pre-ship quality gate)
├── prompts/
│   ├── init.prompt.md             ← /init command (one-time setup: fills copilot-instructions + site.ts from source docs)
│   ├── update.prompt.md           ← /update command (cascade edits to context.md/brand.md into derived files)
│   ├── assets.prompt.md           ← /assets command (generate favicons, icons, OG image, banner)
│   ├── tool.prompt.md             ← /tool command (register/update tool on modrynstudio.com → PR)
│   ├── deps.prompt.md             ← /deps command (version + API pattern validator)
│   ├── log.prompt.md              ← /log command (draft build log post → PR on modryn-studio-v2)
│   ├── seo.prompt.md              ← /seo command (SEO audit + registration)
│   └── launch.prompt.md           ← /launch command (distribution: sharing hooks, social, community posting)
.vscode/
├── settings.json                  ← Agent mode enabled, formatOnSave, Prettier as default formatter
├── extensions.json                ← Recommends Prettier extension on first open
└── mcp.json                       ← MCP server config (GitHub only)
src/config/
└── site.ts                        ← Single source of truth: site name, URL, description, brand colors, social links
src/lib/
├── cn.ts                          ← Tailwind class merge utility (clsx + tailwind-merge)
├── route-logger.ts                ← API route logging utility (createRouteLogger)
└── analytics.ts                   ← GA4 event tracking abstraction (analytics.track)
scripts/
└── generate-assets.ps1            ← Generates all favicons, icons, OG image, and banner from your logomark
context.md                         ← SOURCE OF TRUTH: product facts, stack, routes, monetization
brand.md                           ← SOURCE OF TRUTH: voice, visuals, user types, copy examples
development-principles.md          ← SOURCE OF TRUTH: product philosophy — permanent, do not edit per project
```

> **Cascade rule:** `context.md`, `brand.md`, and `development-principles.md` are the source of truth. Edit them → run `/update` immediately. `copilot-instructions.md`, `site.ts`, and `next.config.ts` are derived — do not edit them directly.

| Source edited                            | Run       |
| ---------------------------------------- | --------- |
| Any source doc (first time, new project) | `/init`   |
| Any source doc (after init already ran)  | `/update` |

## Brand Assets

Drop your logomark, type `/assets`, done.

**Required:**

- `public/brand/logomark.png` — 1024×1024, your mark on a transparent background

That's it. The script auto-detects whether your mark is colored or grayscale and generates the correct light/dark favicon pair automatically.

**Optional overrides:**

- `public/brand/logomark-dark.png` — if present, overrides the auto-detected dark-mode favicon (use when you want a hand-crafted dark version instead of the auto-inverted one)
- `public/brand/banner.png` — 1280×320 README header. Auto-generated from your logomark if missing.

Then type `/assets` in chat — it checks prerequisites, runs the generator, and commits the output automatically.

Or run directly (requires [ImageMagick](https://imagemagick.org)):

```powershell
.\scripts\generate-assets.ps1
```

Re-run any time you update the logomark or after filling in `src/config/site.ts` — the script stamps your site name on the OG image and banner.

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

## Live Log Monitoring

`Ctrl+Shift+B` starts the dev server and pipes all output to `dev.log`.
Once it's running, tell Copilot **"check logs"** at any point — it reads `dev.log` and flags errors, slow API requests, or unexpected responses without you having to paste anything.

Prerequisite: the server must be running and `dev.log` must be capturing output before Copilot can read it. If you haven't started the server yet, do that first.

## Launch Sequence

Run these in order when shipping this product:

1. `@check` — quality gate (fix anything it flags before continuing)
2. `/seo` — technical SEO audit and fixes
3. `/launch` — distribution checklist: sharing hooks, OG, social, screenshots
4. Merge the `/log` and `/tool` PRs on modryn-studio-v2
5. Switch to **modryn-studio-v2** in VS Code, then run in order:
   - `/deploy` — adds the rewrite entry to `next.config.ts` pointing `modrynstudio.com/tools/[slug]/*` → this tool's Vercel URL. **Never add this rewrite manually from the tool repo.**
   - `/social` — generates launch copy using v2 voice rules

> `/deploy` and `/social` are modryn-studio-v2 commands. They only work when modryn-studio-v2 is open in VS Code.

> After editing `context.md` or `brand.md` → run `/update` before continuing to build. Skip this and Copilot works off stale context.

> Tip: `Configure Chat (gear icon) > Diagnostics` shows all loaded configs and errors.
