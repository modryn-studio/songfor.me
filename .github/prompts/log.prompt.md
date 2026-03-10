---
name: log
description: Drafts a build log post for modrynstudio.com from this project's git activity. Opens a PR on modryn-studio-v2 — merge when ready to publish.
agent: agent
---

First, use the GitHub MCP to list files in `content/log/` on `modryn-studio/modryn-studio-v2`. Find the most recent log file for this project (match by tag/slug). If one exists, note its date — then run `git log --oneline --after="YYYY-MM-DD"` to get only commits since that post. If no prior log exists, run `git log --oneline` to get the full history.

Ask Luke: "Anything in that list I should skip, or any context I should know before drafting?"

Then:

1. Use the GitHub MCP to fetch one existing file from `modryn-studio/modryn-studio-v2` at `content/log/` to confirm the frontmatter format and writing style.
2. Draft a MDX post with:
   - Filename: `YYYY-MM-DD-[slug].mdx` — today's date, slug from the topic
   - Frontmatter:

     ```
     ---
     title: ""
     date: "YYYY-MM-DD"
     tag: ""
     seoTitle: ""
     description: ""
     ---
     ```

     The `tag` field must be exactly one of these four values:
     - `launch` — first public post about a tool (new product announcement, v1/v2 ship)
     - `build` — work-in-progress updates, decisions, system/architecture posts, how-I-work posts
     - `milestone` — significant pipeline or infrastructure milestone (e.g. "pipeline is running", "briefings are public")
     - `learning` — reflections, lessons learned, post-mortems

     The `seoTitle` is the `<title>` tag. Format: `[descriptive hook] | Build Log`. 50–70 characters. More specific than the post title — lead with the outcome or insight, not the project name.

     The `description` is the meta description. 110–160 characters. What happened and why it matters.

   - Post body:

     **What shipped** — bullet list of the 3–5 most significant things as human outcomes. Not "feat: add X" but "X is now live".

     **Why** — 1–2 sentences on the decision or problem it solves. Luke's voice: short, direct, honest.

     **What's next** — 1 sentence. One thing. Not a roadmap.

     Leave a `<!-- TODO: fill in narrative -->` comment after each section.

   - Length: 150–300 words. Luke will expand.
   - Tone: building in public, honest, never hype.

3. Create a new branch in `modryn-studio/modryn-studio-v2` named `log/YYYY-MM-DD-[slug]`.
4. Push the draft MDX file to that branch at `content/log/YYYY-MM-DD-[slug].mdx`.
5. Update the tool JSON — derive the tool slug from context.md's URL field (the path segment after `/tools/`). Using the GitHub MCP, fetch `content/tools/[tool-slug].json` from `modryn-studio/modryn-studio-v2` (main branch). If the file exists and is missing a `logSlug` field (or it is blank), push a commit to the PR branch that adds `"logSlug": "YYYY-MM-DD-[slug]"` to the JSON object. If the tool JSON does not exist yet (no card on the studio site), skip and note it in the PR body.
6. Open a pull request from that branch to `main` with:
   - Title: the post title
   - Body: "Draft log post — fill in narrative before merging.\n\nThree `<!-- TODO -->` sections to complete:\n1. After the intro — why this idea now? what triggered it?\n2. After **What shipped** — any surprises during discovery? competing products found?\n3. After **Why** — what made you believe this was the right thing to build right now?"

The PR is the gate. Luke fills in the `<!-- TODO -->` sections in GitHub or by pulling modryn-studio-v2 locally, then merges when ready. Merging = publishing.
