# Copilot Setup — How To Use

> Get live fast. Track before you build. Distribute before you polish. One killer feature, not ten mediocre ones.

---

## Phase 1: Foundation

One-time setup. Run these in order when starting a new project.

1. **Discovery** — two paths:
   - **Starting from scratch** → Open chat (`Ctrl+Alt+I`), select **Agent** mode, pick **@prebuilt**. Describe the idea. It researches, validates, and fills `context.md` + `brand.md` when you say "fill it in."
   - **Docs already written** → You did your own discovery. Drop your pre-filled `context.md` and `brand.md` into the project root, replacing the stubs.
2. Create a blank repo on GitHub
3. Create a project folder locally and clone this boilerplate into it:
   ```powershell
   git clone https://github.com/modryn-studio/nextjs_boilerplate [YOUR_PROJECT_NAME]
   cd [YOUR_PROJECT_NAME]
   ```
4. Re-point the remote to the new project repo:
   ```powershell
   git remote set-url origin https://github.com/modryn-studio/YOUR-REPO
   ```
5. Run `npm install`
6. If you used `@prebuilt`, docs are already filled. If you wrote your own docs, replace the boilerplate stubs with yours now.
7. Run `/validate` — web-searches competitors, user pain, SEO opportunity, and brand positioning. Go back and forth. Update `context.md` and `brand.md` based on findings.
8. Type `/setup` — reads source docs, fills in `copilot-instructions.md` + `src/config/site.ts`. Start the dev server (`Ctrl+Shift+B`) and check the basic landing page in your browser.
9. Create or drop your logomark at `public/brand/logomark.png`. Verify the favicon shows up in the browser tab.
10. Run `/assets` — generates all favicons, icons, and banner. Push to `main`.
11. Run `/deps` — validates all dependencies against live docs, surfaces breaking API changes.

> After setup, **never edit `copilot-instructions.md` or `site.ts` directly**. Edit the source docs → run `/update`.

---

## Phase 2: Go Live

Get a URL as fast as possible. A live site — even a landing page — is worth more than a perfect local prototype. It unlocks tracking, distribution, and public accountability.

**Deploy — two paths based on your deployment mode:**

- **Standalone domain** (the product earns its own brand) →
  1. Purchase domain
  2. Deploy to Vercel (Pro plan if commercial — Hobby prohibits charging money)
  3. Point DNS to Vercel
  4. Set `mode: standalone-domain` and `url:` in `context.md` → run `/update`

- **Subdirectory on modrynstudio.com** (default for most tools) →
  1. Deploy to Vercel (note the `.vercel.app` URL)
  2. Switch to **modryn-studio-v2** in VS Code
  3. Run `/deploy` — adds the rewrite wiring `modrynstudio.com/tools/[slug]/*` → your Vercel URL
  4. Set `mode: modryn-app` and `url:` in `context.md` → run `/update`

**Build your public footprint immediately:**

1. Run `/tool` — registers the tool on modrynstudio.com with `status: "building"`. Merge the PR right away.
2. Run `/log` — first build log post. Document the idea, the origin, the plan. Merge the PR.

> Don't wait until launch for `/tool` and `/log`. Every day the URL exists is a day Google can index it. Every log post is content that compounds.

---

## Phase 3: Instrument & Distribute

You have a live URL. Now wire tracking and do your first distribution push before building the core product. This is counterintuitive but critical — you want data from day one.

1. Run `/seo` — generates missing SEO files, audits the codebase, walks through Search Console + Bing setup. Needs a live URL.
2. Run `/launch` — distribution checklist. Fixes sharing hooks, social footer, OG tags, and share-on-X hooks.
3. Turn on **Vercel Analytics** — add `<Analytics />` to `layout.tsx` if not already present.
4. Run **`@check`** — quality gate on your setup. Scans for bugs, secrets, code issues → auto-fixes what it can → runs lint + build → commits fixes. Never pushes. Takes ~10 minutes — let it run.
5. Switch to **modryn-studio-v2** and run `/social` — generates launch copy (X, Reddit, shipordie) using v2 voice rules. Post on your networks.

> `/deploy` and `/social` are modryn-studio-v2 commands. They only work when modryn-studio-v2 is open in VS Code.

At this point you have: a live site, tracking, SEO filed, a public tool listing, a log post, and social distribution. All before writing a single line of core product code.

---

## Phase 4: Build the Core

Now build the one killer feature. Wire the complete flow end-to-end — from user input to delivered output. Not ten features. One.

### Minimum Money Loop

Wire the complete loop end-to-end before polishing any single piece. One real order through the whole system beats a perfect intake with no delivery.

Open `context.md` → find `## Minimum Money Loop` → keep it visible. Every build session, ask: _does this work advance the loop, or is it polish?_

**Hard rule: do not touch the landing page until the loop has run once with a real order.**

**The dev loop:**

- `Ctrl+Shift+B` — starts the dev server, pipes output to `dev.log`. Tell Copilot **"check logs"** at any point.
- Edit `context.md` or `brand.md` → run `/update` immediately. Skipping this means Copilot works off stale context.
- Run `/deps` if you're unsure whether a package is current.

**Before a major implementation:**

Run `/validate` with a focus area. The mechanics matter — this only works correctly in **Agent mode**:

1. Type `/validate` in the chat input — VS Code will show a dropdown suggesting the prompt. Select it so the prompt file actually loads.
2. In the **same message**, after the slash command, add your focus question.
3. Submit. The agent runs the full prompt file + your focus question with live web search.

Example messages:

- `/validate — validate my approach to the conversational intake before I build it. Is chat-style intake better than a progressive form for impulse buyers?`
- `/validate — validate whether $9.99 is still the right price given BirthdaySongMaker's free tier`
- `/validate — validate my plan to build the /song/[id] page next. What should I know about how competitors design song delivery pages?`

**If the output looks entirely offline** (no fetched URLs, no live competitor data cited): you're in Ask or Plan mode, not Agent mode. Switch to Agent and run again.

**When you're stuck:**

Getting stuck is normal. Here's the playbook:

1. **Research** — do competitor analysis. Screenshot their flows. Read their reviews. Share findings with Copilot.
2. **Revalidate** — run `/validate` focused on the area you're stuck on. "Validate my competitor positioning given what I found."
3. **Plan** — switch to **Plan** mode in chat. Hash out the architecture or approach before switching back to Agent to build.
4. **Roadmap** — share your research + ask Copilot for a mini roadmap. Implement one step at a time.

**After a major implementation:**

Run **`@check`** as a quality gate. Then push.

---

## Phase 5: Iterate

You have a working core feature. Now loop: ship → validate → distribute → repeat.

1. Run **`@check`** — quality gate after implementation.
2. Run `/polish` — UI consistency sweep. Ensures all interactive elements use shared primitives, brand tokens are applied consistently, responsive spacing is correct, mobile keyboard safety is wired, and touch targets meet minimums.
3. Run `/tool` — update the tool listing (flip status to `live` when ready). Merge the PR.
4. Run `/log` — document what you shipped. Each log post is content and distribution. Merge the PR.
5. Run `/social` (from modryn-studio-v2) if the milestone is worth announcing.
6. **Repeat Phase 4–5** until your first paying user.

**Milestones that earn a `/log` post:**

- Core feature working end-to-end
- First real order
- First stranger pays
- Major pivot or architecture decision
- Beta launch

**When to run `/validate` again:**

- Before adding a second feature (are you sure the first one is done?)
- After significant competitor research
- When your positioning or pricing might need to shift

> The goal of Phase 5 is not perfection — it's getting to one stranger paying $9.99 and sharing the result. Everything else is noise.

---

## Quick Reference

### Reusable vs. One-Time Commands

| Command     | Frequency | What it does                                                                                                                                                          |
| ----------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@prebuilt` | Once      | Pre-build discovery: researches market, fills `context.md` + `brand.md`                                                                                               |
| `/setup`    | Once      | Fills `copilot-instructions.md` + `site.ts` from source docs                                                                                                          |
| `/deps`     | Reusable  | Validates dependencies against live docs                                                                                                                              |
| `/assets`   | Reusable  | Generates favicons, icons, banner from logomark                                                                                                                       |
| `/validate` | Reusable  | Reads `context.md`, `brand.md`, `strategy.md` + web-searches to validate. **Agent mode only.** Phase 1: run open-ended. Phase 4+: add focus question in same message. |
| `/seo`      | Once      | SEO audit + Search Console + Bing setup                                                                                                                               |
| `/launch`   | Once      | Distribution checklist: sharing hooks, OG, social prep                                                                                                                |
| `/update`   | Reusable  | Cascades source doc edits into derived files                                                                                                                          |
| `/tool`     | Reusable  | Registers/updates tool on modrynstudio.com (`building` → `live`)                                                                                                      |
| `/log`      | Reusable  | Drafts a build log post — run at every milestone                                                                                                                      |
| `/polish`   | Reusable  | UI consistency sweep: primitives, migrations, responsive, keyboard safety, touch targets                                                                              |
| `@check`    | Reusable  | Quality gate: bugs, secrets, lint, build → auto-fixes, commits. Never pushes                                                                                          |

> **modryn-studio-v2 only:** `/deploy` and `/social` exist only in that repo. Switch workspaces to run them.

### `@check` — When to Run

`@check` is a quality gate, not a one-time step. Run it at transitions:

- **End of Phase 3** — setup clean before building features? (recommended)
- **After Phase 4 implementations** — ready for users? (required)
- **Before any push you're unsure about** — best practice
- **Takes ~10 minutes** — let it run, don't interrupt

> **Before running `@check`:** Switch the chat permissions picker to **Bypass Approvals** (bottom of the Chat view, next to the model selector). This lets `@check` auto-confirm file edits and terminal commands without interrupting for approval — which is exactly what it needs to run end-to-end. Switch back to Default Approvals when done.
>
> There's no way to set this programmatically — it's a per-session UI setting only. No frontmatter field, no hook, no command can trigger it. The step is: open Chat → switch to Bypass Approvals → invoke `@check`.

### `/validate` — Two Modes

1. **Setup validation** (Phase 1): "validate my market positioning" — broad, uses docs + web search
2. **Focused validation** (Phase 4+): "validate my competitor positioning and intake approach" — you tell it what to examine

### VS Code Modes

| Mode      | When to use                         | How                   |
| --------- | ----------------------------------- | --------------------- |
| **Ask**   | Quick questions about your codebase | Chat → select "Ask"   |
| **Plan**  | Blueprint a feature before building | Chat → select "Plan"  |
| **Agent** | Build, edit files, run commands     | Chat → select "Agent" |

Open chat: `Ctrl+Alt+I`

### Brand Assets

Drop your logomark at `public/brand/logomark.png` (1024×1024, transparent background), then type `/assets`.

The script auto-detects whether your mark is colored or grayscale and generates the correct light/dark favicon pair.

**Optional overrides:**

- `public/brand/logomark-dark.png` — hand-crafted dark favicon (skips auto-inversion)
- `public/brand/banner.png` — 1280×320 README header (auto-generated if absent)

**What gets generated:**

| File                      | Purpose                                           |
| ------------------------- | ------------------------------------------------- |
| `public/icon-light.png`   | Favicon in light mode (via `layout.tsx` metadata) |
| `public/icon-dark.png`    | Favicon in dark mode (via `layout.tsx` metadata)  |
| `src/app/favicon.ico`     | Legacy fallback — Next.js file convention         |
| `src/app/icon.png`        | 1024×1024 — Next.js file convention               |
| `src/app/apple-icon.png`  | iOS home screen — Next.js file convention         |
| `public/brand/banner.png` | README header (auto-generated if absent)          |

OG image is generated at build time by `src/app/opengraph-image.tsx` — not a static file.

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
├── copilot-instructions.md          ← Always-on context (derived — edit source docs, not this)
├── instructions/
│   ├── nextjs.instructions.md       ← Auto-applied to .ts/.tsx files
│   ├── seo.instructions.md          ← Auto-applied to .ts/.tsx files
│   └── design-system.instructions.md ← Auto-applied to .tsx files (primitives, brand tokens, responsive)
├── agents/
│   ├── check.agent.md               ← @check agent (quality gate — reusable)
│   └── prebuilt.agent.md            ← @prebuilt agent (pre-build discovery)
├── prompts/
│   ├── setup.prompt.md              ← /setup (once)
│   ├── update.prompt.md             ← /update (reusable)
│   ├── validate.prompt.md           ← /validate (reusable)
│   ├── assets.prompt.md             ← /assets (reusable)
│   ├── tool.prompt.md               ← /tool (reusable)
│   ├── deps.prompt.md               ← /deps (reusable)
│   ├── log.prompt.md                ← /log (reusable)
│   ├── seo.prompt.md                ← /seo (once)
│   ├── launch.prompt.md             ← /launch (once)
│   └── polish.prompt.md             ← /polish (reusable)
.vscode/
├── settings.json                  ← Agent mode, formatOnSave, Prettier default formatter
├── extensions.json                ← Recommends Prettier on first open
└── mcp.json                       ← MCP server config (GitHub)
src/config/
└── site.ts                        ← Derived — site name, URL, colors, social links (edit via /update)
src/lib/
├── cn.ts                          ← Tailwind class merge utility
├── route-logger.ts                ← API route logging (createRouteLogger)
└── analytics.ts                   ← Vercel Analytics event tracking (analytics.track)
scripts/
└── generate-assets.ps1            ← Asset generator (run via /assets)
context.md                         ← SOURCE OF TRUTH: product, stack, routes, monetization
brand.md                           ← SOURCE OF TRUTH: voice, visuals, user types, copy
development-principles.md          ← SOURCE OF TRUTH: product philosophy (permanent)
strategy.md                        ← SOURCE OF TRUTH: monetization, distribution, launch playbook (permanent)
```

> **Tip:** To debug why a prompt or instruction isn't loading, open the Agent Debug panel: `Command Palette → Developer: Open Agent Debug Panel`. Shows system prompts, tool calls, and every customization loaded for the session. You can also type `#debugEventsSnapshot` in chat to attach a live snapshot of agent debug events directly into your message — then ask Copilot to explain what's loaded, what's missing, or why something isn't firing. Faster than reading the raw panel logs.

> **Tip:** After any session where you corrected Copilot on a boilerplate pattern, type `/create-instruction` to turn those corrections into a persistent `.instructions.md` file. Save it to `.github/instructions/` so it travels with the boilerplate. For multi-step procedures (e.g. a fix workflow), `/create-skill` packages it as a reusable runbook instead.
