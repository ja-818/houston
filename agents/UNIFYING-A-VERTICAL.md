# Unifying a Vertical — Multi-Agent → Single Agent Playbook

**For any Claude Code session** asked to take an existing multi-agent
vertical workspace (`founder-marketing-workspace`, `founder-sales-
workspace`, `hr-workspace`, …) and ship a **single consolidated
agent** covering the same surface into `simplified-verticals/`.

This doc is the counterpart to `BUILDING-A-VERTICAL.md`. That one
tells you how to build a fresh 3-6 agent workspace. This one tells
you how to collapse one into a simplified version — one agent, one
context ledger, one conversation.

You are NOT redesigning the vertical from scratch. The source
workspace is your spec — its skills, positioning doc, outputs, and
routines are the inputs. Your job is to unify them.

---

## Why this playbook exists — the origin and intention

**Read this before the "how."** If you understand *why* we unify,
the "how" reads itself and you'll make the right calls in the edge
cases the playbook doesn't cover. If you skip this and just execute
the phases, you'll mechanically reproduce the marketing agent for
other verticals and miss the reasons some choices bent one way and
not the other.

### The original bet (what we shipped first)

The founder workspaces (`founder-marketing-workspace`,
`founder-sales-workspace`, …) were designed around the **hireable-
role test**: if you'd hire two different humans for it, it's two
agents. That gave us 6 marketing agents (Head of Marketing, SEO &
Content, Growth & Paid, Lifecycle & Email, Social & Community,
Conversion Copywriter). Specialization felt right — each agent had
a coherent identity, a narrow skill set, its own onboarding, and a
clean LinkedIn-job mapping.

`AGENT-DESIGN-PHILOSOPHY.md` defends this split explicitly. The
reasoning is sound **for the problem it was framed around** — a
user who wants the container to match the human org chart.

### What we saw in practice

The specialization tax showed up faster than the specialization
benefit:

1. **Onboarding stacked.** Each agent ran its own 3-question
   `onboard-me`. Across a 6-agent workspace that's up to 18
   questions before the founder produced any artifact. In reality
   founders onboarded 1-2 agents and left the rest half-
   configured — so cross-agent work silently failed or produced
   generic output.
2. **Shared context fractured.** Positioning, ICP, voice — these
   are facts about the *company*, not the role. The Head of
   Marketing owned `product-marketing-context.md` and every other
   agent read it via `../head-of-marketing/product-marketing-
   context.md`. When any of those 5 cross-agent paths broke, so
   did the agent that depended on it. The file-system became a
   shared-mutable-state database, and we re-invented the pain of
   shared-mutable-state databases.
3. **Routing became the founder's job.** Real marketing work
   rarely stays in one lane. A launch touches positioning +
   social + email + paid + copy. The founder had to open 5
   agents, re-context each one, and manually coordinate. "Which
   agent do I ask about this?" was a question they had to answer
   before every task.
4. **Skill duplication.** `write-blog-post`, `draft-linkedin-
   post`, `draft-x-thread`, `write-newsletter`, and `draft-
   community-reply` are structurally the same skill with
   different output shapes. Five SKILL.md files, five near-
   identical bodies, five places to keep the voice rules
   consistent when they drifted.
5. **"Simplified" got requested by name.** Users asked for one
   marketing hire, not a six-seat team. The installed experience
   of "hire the team" felt heavier than what a solo founder
   wanted to live with day-to-day.

The role-based split had optimized for a problem (specialization,
clean identities, 1:1 LinkedIn-job mapping) that wasn't the
problem the user actually had. Their real problem: "I need
marketing done, I'm one person, I don't want to manage a team of
agents."

### The mental flip

The founder's noun is the **vertical**, not the **roles inside
it**. They think "I need to do marketing today," not "I'll chat
with my Head of Marketing, then my Lifecycle person, then my
Social agent." Unifying the vertical into one agent matches that
mental model.

Once you make that flip, every other design choice falls out:

- **No upfront onboarding** → because the agent learns what it
  needs by doing the work, not by conducting an intake.
- **Context ledger** → because context is shared-by-default;
  partitioning it across 6 agents was the bug.
- **Consolidated skills with params** → because five near-
  duplicates weren't "modular," they were five things the founder
  had to discover and remember.
- **Skills descriptions = use cases** → because the founder reads
  skills to learn what the agent can do, not to understand its
  internal routing.
- **Filter chips over per-agent tabs** → because the founder
  already knows which domain they're in, and browsing by domain
  is how they think.
- **Routines written against one outputs.json** → because the
  weekly review is one review across the whole vertical, not five
  reviews that the founder has to stitch.

### What we lose (name it honestly)

- Clean per-role identity. You can't install just "the SEO piece"
  of the unified marketing agent — it's all or nothing.
- Strict role-coherence ("the Lifecycle agent never suggests paid
  ads"). The unified agent is a generalist that branches
  contextually; it'll cross domains the moment you ask.
- LinkedIn-job-title mapping. "I'm hiring my SDR" doesn't map to
  one of our simplified verticals — it maps to a sales *team*.

### Why we ship both, not migrate

The multi-agent version is not wrong — it serves a different user.
A real marketing team of three humans benefits from per-role
agents because the containers match the seats. A solo founder
benefits from one operator because their workflow is one-seat.

Both versions stay in the catalog. Users self-select. This is
**segmentation**, not deprecation.

### The principles you must carry (the checklist)

Any time this playbook's "how" conflicts with your instinct, check
which principle applies:

1. **The vertical is the unit, not the roles inside it.** If
   you're building a unified agent and it starts to feel like a
   team-in-disguise (with "coordinator" + "specialist" sub-
   behaviors), you're violating this. Collapse.
2. **Context is shared-by-default.** If you're writing a skill
   that needs data and the data lives "in another agent" — stop.
   It lives in the ledger or in the positioning doc.
3. **Adaptive > prescriptive.** Every field you capture upfront
   is friction you added to the first interaction. Capture inline,
   exactly when the skill needs it.
4. **Near-duplicate is UX debt, not architecture debt.** The
   founder doesn't care that five skills share 80% of their body.
   They care that their menu has 5 "write something" items they
   have to disambiguate in their head. Merge.
5. **Descriptions are founder-facing.** The skill's `description`
   is what the founder reads to learn what the agent does. If it
   reads like internal routing ("the user says X, dispatch to Y"),
   you're writing for the wrong audience.
6. **Be critical about routines.** A routine that fires when
   nothing's wrong trains the founder to ignore the routine. Ship
   fewer, mean it, use `suppress_when_silent` for regression checks.
7. **The best signal of a good simplification is that it felt
   obvious in hindsight.** The unified marketing agent's
   consolidation table reads trivial once written; the original
   6-agent split took 50+ skills to land there. Trust the
   compression — if you're fighting to keep two skills separate
   because "they feel different," they probably aren't.

These are what the phases below execute. If you're ever blocked
on "which way should I do X?" — re-read the principles. The
answer is almost always in there.

---

## When to unify (and when NOT to)

**Unify when:**

- The source workspace has 4+ agents and meaningful skill overlap
  (e.g. 5 channel-specific `write-X-post` skills that could be
  one `write-content` with a `channel` param).
- The source agents share a cross-agent positioning / playbook doc
  — that's the strongest signal a single agent can hold the
  context.
- The user is a solo founder / sole operator (not a team).

**Don't unify when:**

- The source agents represent genuinely different hireable roles
  with non-overlapping outputs (Controller + Bookkeeper share
  tooling but produce different artifacts — keep separate).
- The source workspace is 2 agents already (unify gives ~10% win
  at much higher cost).
- The user's workflow is multi-seat (a real team with three
  humans — the per-role containers are the feature).

**Granularity test for the unified agent:** if you'd chat with the
source team as "Marketing" / "Sales" / "Support" — one noun, one
conversation — the unification is right.

---

## Preconditions

Before running this playbook:

1. **Source workspace is complete** — every agent has
   `houston.json`, `CLAUDE.md`, `bundle.js`, `icon.png`,
   `data-schema.md`, a populated `.agents/skills/` tree, and
   (ideally) `useCases`.
2. **`simplified-verticals/` repo is cloned locally** at
   `verticals-store/simplified-verticals/`. Public repo:
   `https://github.com/CamiloCaceres/simplified-verticals`.
3. **A finished reference exists** —
   `verticals-store/simplified-verticals/agents/marketing/` is the
   worked example this playbook is written from. Read it end-to-
   end before executing. Every pattern you need appears there.

---

## Phase-by-phase workflow

### Phase 1 — Source audit (inventory, don't plan yet)

**Why this phase exists:** you cannot consolidate what you haven't
inventoried. The audit makes the "where is the real duplication?"
question answerable instead of intuited. Skipping this phase =
you'll miss a skill cluster, make a bad consolidation, or
accidentally drop a cross-agent read the founder depends on.

1. List every agent in the source workspace. Record the agent
   `id` and the human-job it represents.
2. For each agent, list every skill (`.agents/skills/*/SKILL.md`).
   For every skill capture:
   - `name:` and trigger phrases from the `description:` line
   - What it writes (artifact path + output type)
   - What it reads (`config/*`, `../{other-agent}/...` cross-
     reads)
   - Whether it declares `integrations:`
3. Identify **cross-agent reads** — every `../{agent-name}/...`
   path across the source tree. These are the pain points the
   unified agent eliminates.
4. Identify the **source positioning / playbook doc** — the file
   owned by the coordinator (Head of X) and read cross-agent by
   every other agent. In the unified version it moves to
   `context/{vertical}-context.md` at the agent root, owned
   locally.
5. Inventory the source `useCases` across every agent's
   `houston.json`. Target: a single flat list grouped by domain.
6. List the source `routines` (in each agent's `houston.json`
   under `agentSeeds → .houston/routines/routines.json`). You'll
   rethink these from scratch in Phase 7 — don't port as-is.

**Deliverable:** a scratch inventory table (in-session) of shape
`(source-agent, skill-name, reads, writes, trigger-phrases,
integrations)`. No file yet.

---

### Phase 2 — Design (skill consolidation map + ledger + chips)

**Why this phase exists:** this is the ONLY phase where you
think. The consolidation map is the compression function. If you
get it right here, every subsequent phase is mechanical. If you
get it wrong, you'll be paying for it in inconsistency across
every SKILL.md the subagent writes.

#### 2a. Consolidation map

For each cluster of near-duplicate skills in the inventory, pick
one unified skill behind a parameter. Target: ~25 unified skills
from ~50 source skills.

**Rule of thumb — merge if the source skills share:**

- The same structural shape (hook → body → CTA; brief → draft →
  save; audit → score → fix list)
- The same tooling category (all scrape / all SEO tool / all ESP)
- Only differ in a target format / channel / surface / subject

**Keep separate if** the source skills produce materially
different artifacts or read materially different inputs.

**Worked marketing example** (copy and adapt to your vertical):

| Unified skill | Param | Replaces |
|---|---|---|
| `write-content` | `channel` ∈ {blog, linkedin, x-thread, newsletter, reddit} | 5 channel-specific writers |
| `write-page-copy` | `surface` ∈ {homepage, pricing, about, landing, signup-flow, onboarding, paywall, popup} | 5 surface-optimization skills |
| `audit` | `surface` ∈ {site-seo, ai-search, landing-page, form} | 4 audit skills |
| `plan-campaign` | `type` ∈ {paid, launch, lifecycle-drip, welcome, churn-save, announcement} | 6 campaign-planners |
| `monitor-competitors` | `source` ∈ {product, ads, social-feed} | 3 tracking skills |
| `analyze` | `subject` ∈ {funnel, content-gap, marketing-health} | 3 analysis skills |

Everything else ports 1:1 — 17 skills in the marketing case.

**Drop every `onboard-me` skill.** The unified agent has no
upfront onboarding. Context capture becomes a ledger read + just-
in-time ask inside every skill (see 2b).

#### 2b. Context ledger

**Why:** context is shared-by-default. Per-agent `config/profile.
json` / `icp.json` / `voice.md` partitioned facts-about-the-
company across agents and then forced cross-reads to reshare
them. The ledger treats context as a single resource.

One JSON file replaces all per-agent configs. Schema sketch:

```json
{
  "universal": {
    "company":     { "name", "website", "pitch30s", "stage", "capturedAt" },
    "voice":       { "summary", "sampleSource", "sampleCount", "capturedAt" },
    "positioning": { "present": true, "path": "context/{vertical}-context.md", "lastUpdatedAt" },
    "icp":         { "industry", "roles", "pains", "triggers", "capturedAt" }
  },
  "domains": {
    "{domain-1}": { ... per-domain fields ... },
    "{domain-2}": { ... },
    ...
  }
}
```

**Per-domain fields** mirror the old per-agent `config/` files.
For marketing: `seo.domain + seo.tooling`, `email.platform +
email.journey`, `social.platforms + social.topics`,
`paid.channels + paid.analytics + paid.primaryConversion`,
`copy.primaryPage + copy.primaryConversion + copy.leakiestSurface`.

**Capture rule baked into every skill:** read ledger first → for
any missing field the skill needs, ask ONE targeted question with
a modality hint (Composio connection > file drop > URL > paste)
→ write the field atomically → continue. Never ask the same field
twice.

Seed the ledger at install with an empty skeleton:

```json
{ "universal": {}, "domains": { "{domain-1}": {}, ... } }
```

#### 2c. Positioning doc lives locally now

**Why:** every cross-agent read (`../{agent}/positioning.md`) was
a fragile pointer. The positioning doc is a property of this
agent now, owned locally.

Move the source workspace's shared doc from
`{coordinator-agent}/product-X-context.md` to
`context/{vertical}-context.md` at the unified agent root. Owned
locally by the `define-{thing}` skill (positioning / playbook /
charter — whatever the vertical's equivalent is).

#### 2d. Filter chip domains

**Why:** the founder browses by mental domain, not by role.
"What can I do about SEO today?" not "Let me open the SEO agent."
Filter chips match the mental browse, and keep the Overview grid
scannable when there are 30-45 tiles.

Pick 4-7 domain chips for the Overview filter bar. These should
match the sections of your CLAUDE.md skill index. "All" is
implicit (first chip).

Marketing: `Positioning · SEO · Email · Social · Paid · Copy`.

**Document the consolidation map + ledger schema + chip list** in
your head before touching files. If you can't fit it on one
whiteboard, you're over-consolidating.

---

### Phase 3 — Scaffold the unified agent

**Why this phase exists:** get the skeleton right so you never
touch it again. Every subsequent phase fills in pieces of this
tree; if the scaffold is wrong (missing tab, wrong `agentSeeds`
format, reserved tab-id), you'll debug it after writing 25 skill
files.

Working directory from here on:
`simplified-verticals/agents/{vertical}/`

Target layout:

```
agents/{vertical}/
├── houston.json
├── CLAUDE.md
├── data-schema.md
├── bundle.js
├── icon.png
├── .gitignore
├── config/              # created empty; populated at runtime
├── context/             # the positioning doc lives here
└── .agents/skills/      # Phase 4 fills this
```

#### 3a. `houston.json` essentials

Required top-level fields: `id`, `name`, `description`, `icon` (a
Lucide name), `category`, `author`, `tags`, `tabs`, `defaultTab`.

Tabs (order matters — Overview must be first):

```json
[
  { "id": "overview",        "label": "Overview",        "customComponent": "Dashboard" },
  { "id": "activity",        "label": "Activity",        "builtIn": "board", "badge": "activity" },
  { "id": "routines",        "label": "Routines",        "builtIn": "routines" },
  { "id": "job-description", "label": "Job Description", "builtIn": "job-description" },
  { "id": "files",           "label": "Files",           "builtIn": "files" },
  { "id": "integrations",    "label": "Integrations",    "builtIn": "integrations" }
]
```

**Reserved-id trap:** the first tab `id` must NOT be `dashboard`,
`connections`, or `settings` — those silently hijack rendering.
Use `overview`.

#### 3b. `agentSeeds`

Seed these files on install:

- `outputs.json` → `"[]"`
- `config/context-ledger.json` → the empty skeleton from 2b
- `.houston/activity.json` → a single "Start anywhere — I'll ask
  for what I need" onboarding card (replaces the per-agent
  "Onboard me" cards)
- `.houston/routines/routines.json` → your routine set from
  Phase 7 (seeded later)

All `agentSeeds` values are **strings** containing JSON. Each `"`
in the embedded JSON becomes `\"`. Validate after editing:

```bash
python3 -c "import json; d=json.load(open('houston.json'));
[json.loads(d['agentSeeds'][k]) for k in d['agentSeeds']]; print('ok')"
```

#### 3c. `CLAUDE.md` structure (~150-200 lines)

**Why this shape:** the file is read both by the model (for
routing) and by the founder (via Job Description tab). Domain
grouping serves both — the model sees triggers, the founder sees
categories.

Sections in order:

1. **Identity** — "I'm your full-stack {vertical} operator" +
   one-line boundary (drafts only, never publishes, …).
2. **To start** — "No upfront onboarding. Click any Overview
   tile…" + the best-modality hint.
3. **My skills** — GROUPED BY DOMAIN (one `##` section per chip).
   One line per skill: "`skill-name` — use when you say '…' —
   [what it does in ≤1 line]". Name the param explicitly for
   consolidated skills.
4. **Context protocol** — how the ledger works + list of fields
   the ledger tracks.
5. **Cross-domain workflows** — 2-3 paragraphs on how the agent
   chains skills inline (launch → content + campaign + page-
   copy). This replaces the old multi-agent orchestration.
6. **Composio is my only transport** — list tooling categories
   used (Inbox, CRM, Meetings, Scrape, SEO, Docs, …).
7. **Data rules** — agent root, atomic writes, flat artifact
   folders, no `.houston/<agent-path>/` at runtime.
8. **What I never do** — hard nos (send without approval, invent
   quotes, hardcode tool names, …).

#### 3d. `data-schema.md`

Document:

- `config/` — the context ledger shape (TS interface).
- `context/{vertical}-context.md` — the positioning doc (live,
  not in `outputs.json`).
- `outputs.json` — a single index with a `type` union covering
  every artifact kind and a `domain` field matching the chips.
- Every artifact folder — table of `folder / written-by / notes`.
- Explicit statement: **no cross-agent reads**. Everything under
  this agent's root.

#### 3e. `icon.png`

256×256 solid-color PNG. Python stdlib one-liner:

```python
import struct, zlib
def chunk(t,d): return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t+d) & 0xffffffff)
size = 256; r, g, b = 0x7C, 0x3A, 0xED  # pick an accent per vertical
ihdr = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)
row = bytes([0]) + bytes([r, g, b]) * size
png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', zlib.compress(row*size, 9)) + chunk(b'IEND', b'')
open('icon.png', 'wb').write(png)
```

#### 3f. `.gitignore`

```
*.tmp
config/
context/
```

`config/` and `context/` are runtime state, never committed.

---

### Phase 4 — Skills (~25 SKILL.md files)

**Why this phase has two halves:** ports vs consolidations
require different tools. Ports are mechanical (regex + string
replacement). Consolidations require synthesis (read 5 source
skills, design a branch, write one unified). Don't confuse the
two — dispatching a subagent for a mechanical port wastes
tokens; editing a consolidation manually burns your focus.

#### 4a. Port the 1:1 skills (mechanical)

For every source skill on your keep-list, copy the SKILL.md and
apply these mechanical rewrites via a Python script:

1. `{coordinator}/{vertical}-context.md` →
   `context/{vertical}-context.md`
2. `../{other-agent}/{vertical}-context.md` →
   `context/{vertical}-context.md`
3. `../{other-agent}/outputs.json` → `outputs.json`
4. `../{other-agent}/{topic}/` → `{topic}/` (flat at root)
5. Language: "the other N agents", "the SEO agent", "the
   Lifecycle agent" → "every other skill / domain of this
   agent" or drop entirely.

See Appendix B for `port_simple_skills.py` — it's one-page.

#### 4b. Consolidated skills (dispatch a subagent)

**Why a subagent:** 6-7 consolidated skills is a lot of focused
writing and it hurts main-thread tokens. Subagent gets the
sources, the template, and the rules; returns 6 files.

For each row in your consolidation map, the subagent writes one
SKILL.md. Target ~100-180 lines per file. Structure:

```markdown
---
name: {skill-id}
description: "Use when you say '…' / '…' — I {verb} the `{param}` you pick: `opt1` {what} · `opt2` {what} · `opt3` {what}. Writes to `{output-pattern}`. {punchy close}."
integrations: [slug1, slug2, slug3]
---

# {Skill Title}

## When to use
- Trigger phrases (user-facing).
- When another skill chains into this one.

## Ledger fields I read
- `universal.{field}` — why.
- `domains.{domain}.{field}` — why.

If any required field is missing, ask ONE targeted question with a
modality hint (Composio > file > URL > paste), write it, continue.

## Parameter: `{name}`
- `{value-1}` — {what this branch produces + output path + tool}.
- `{value-2}` — {same}.

## Steps
1. Read the ledger, fill gaps.
2. Read the positioning doc at `context/{vertical}-context.md`.
3. Branch on `{param}`:
   - If `{param} = value-1`: {concrete step-by-step}.
   - If `{param} = value-2`: …
4. Write the artifact at `{output-path}`.
5. Append to `outputs.json` with {id, type, title, summary, path, status, createdAt, updatedAt, domain}.

## Outputs
- `{path-pattern-1}` (for `{param} = value-1`)
- Appends to `outputs.json`.

## What I never do
- {1-2 hard nos specific to this skill}.
```

**Dispatch prompt** must give the subagent:

- Target directory
- Consolidation map row-by-row
- List of source SKILL.md files per row (to read for faithful
  consolidation)
- The template above
- Verified Composio slugs list (Appendix A)
- A reference SKILL.md to copy tone from

**Watch for the subagent failure mode: agent-speak.** Subagents
reliably write "Use when **the user** says…" (3rd person) and
"via Composio (googledocs / twitter / mailchimp)" (raw slugs) —
both wrong for founder-facing descriptions. Fix in Phase 8.

#### 4c. Skip intentionally

- All `onboard-me` skills.
- Skills that were only "make sure this cross-agent doc exists"
  scaffolding.
- Skills that were pure wrappers over a sibling agent's output.

---

### Phase 5 — useCases (Overview tiles)

**Why this phase is critical:** the useCase tile is the founder's
entry point. Bad tiles = founder opens Overview, sees bland text,
closes the app. Good tiles = founder clicks without thinking,
the agent produces artifact, founder returns tomorrow.

One flat `useCases` array in `houston.json`. Target ~30-45 tiles,
each with:

```json
{
  "category":   "{one of the chip labels — must match exactly}",
  "title":      "{verb-forward outcome, bold bet, ~60 chars}",
  "blurb":      "{one line, 6-12 words, what makes this sharp}",
  "prompt":     "{short visible text the founder would type}",
  "fullPrompt": "{rich prompt sent to chat — names the skill, names the param, names the artifact path}",
  "description": "{2-3 sentences founder-facing, same as skill description style}",
  "outcome":    "{'Draft at {path}' or 'Scored at {path} — {hint}'}",
  "skill":      "{unified-skill-name}",
  "tool":       "{user-facing tool name — 'Semrush' not 'semrush'; omit if no primary tool}"
}
```

**Rules:**

- **Click = send** — clicking a tile fires `fullPrompt` (richer)
  into chat, not `prompt`. `prompt` is just the visible short
  form.
- **`fullPrompt` names the skill and param** so routing is
  deterministic. Example: `"…Use the write-content skill with
  channel=blog…"`.
- **Categories match chips exactly.** Tiles whose category doesn't
  match a chip are orphaned.
- **Distribute tiles evenly.** If one chip has 15 and another
  has 2, something's wrong.
- **No "onboard" tiles.** There's no onboarding skill anymore.

---

### Phase 6 — `bundle.js` with filter chips

**Why filter chips (not per-agent tabs):** chips match the way
the founder browses — by domain, not by role. They also let the
Overview host 40+ tiles without becoming a wall of text.

The bundle is a hand-crafted IIFE with a filter-chip strip above
the tile grid. Start from the worked example:
`simplified-verticals/agents/marketing/bundle.js`.

Per-vertical customization lives in one embedded `AGENT` object —
name, tagline, `chips`, `useCases`. Everything else (tile styles,
send hook, chip bar, filter logic) is shared.

**Generate, don't hand-edit.** Use a Python script that reads
`houston.json.useCases` and bakes them into the template (see
`generate_marketing_bundle.py`, Appendix B). Verify with the Node
shim:

```bash
node -e "global.window={Houston:{React:{createElement:()=>null,useState:()=>[null,()=>{}],useCallback:f=>f,useMemo:(f)=>f()}}}; eval(require('fs').readFileSync('bundle.js','utf8')); console.log('exports:', Object.keys(window.__houston_bundle__));"
# expected: exports: [ 'Dashboard' ]
```

**Hard rules for bundle.js** (these are what broke earlier
iterations):

- `var React = window.Houston.React;` — never `import React`.
- `React.createElement` (aliased as `h`). No JSX, no build step.
- Do NOT use `@houston-ai/core` — not exposed to bundle scope.
  Inline styles + raw divs.
- Styling via injected `<style>` block (Tailwind classes
  generated at runtime aren't in Houston's JIT output).
- Keep the literal string `useHoustonEvent("houston-event", ...)`
  somewhere in a comment (Phase-6 grep check).
- Export: `window.__houston_bundle__ = { Dashboard: Dashboard };`.
- Tiles fire `sendMessage(uc.fullPrompt || uc.prompt)` on click.
- Filter chips: `useState` for active chip + `useMemo` for
  filtered list keyed on the active chip.

---

### Phase 7 — Routines (be critical)

**Why this phase matters more than it looks:** routines that
fire when nothing's wrong train the founder to ignore the agent.
The default set you ship is the founder's first impression of
recurring value — get it wrong and they disable the tab.

**Do not port the source workspace's routines.** Rethink from
scratch.

**The critical filter.** A routine earns its slot only if:

1. **Cadence is right.** Daily cron becomes noise within a week.
   Weekly is the right floor for most work. Monthly for
   regression checks.
2. **It surfaces what the founder wouldn't notice otherwise.**
   Telling them what they already know = cut. Catching a broken
   page, a ranking cliff, a competitor pricing drop = keep.
3. **It's not redundant with another routine.** If the Monday
   review already rolls up funnel data, don't ship a separate
   Friday funnel readout.
4. **It works for every user in the target segment.** Conditional
   routines ("only useful if heavy on LinkedIn") should be cut
   from defaults and added later via the Routines tab.

**The cadence template** (adapt per vertical):

| Cadence | Purpose | `suppress_when_silent` |
|---|---|---|
| **Weekly "Monday review"** | Roll up what shipped last week, flag stale, recommend next move | `false` — always surface, it's the ritual |
| **Weekly "pulse / check"** | External-awareness scan (competitors, market, inbound signal) | `false` — a quiet week is still news |
| **Monthly audit #1** | Technical regression check (SEO audit, CRM hygiene, subscription health) | `true` — silent unless a new issue |
| **Monthly audit #2** | Emerging-category regression check (GEO audit, new channel visibility) | `true` — silent unless shift |

4 routines is the right count for most verticals. 3 is fine. 5
is over-extending.

**Writing routine prompts:**

- Name the skill and param explicitly.
- Tell the agent what to compare against (prior audit, prior
  week's `outputs.json`) so "nothing changed" detection works.
- For `suppress_when_silent: true`, tell the agent "on the first
  run (no prior X exists), always surface — that's the baseline."
- Don't duplicate the `ROUTINE_OK` instruction — the engine
  appends it automatically.

**Seed the routines** in `houston.json → agentSeeds →
".houston/routines/routines.json"`. The seed value is a
**string** containing the JSON-encoded array. See
`ADD_ROUTINE_TO_AGENT.md` for required fields (`id`, `created_at`,
`updated_at`).

**Schedule examples** (5-field cron, no seconds):

- `0 8 * * 1` — Monday 08:00
- `0 15 * * 5` — Friday 15:00
- `0 8 1 * *` — 1st of month 08:00
- `0 8 15 * *` — 15th of month 08:00
- `0 */2 * * 1-5` — every 2 hours on weekdays (almost always
  wrong — avoid)

---

### Phase 8 — Quality sweep

**Why this phase exists:** the subagent in Phase 4b and the port
script in Phase 4a both leak artifacts of the source. Descriptions
will have "the user says" (agent-speak). Skill bodies will have
`../head-of-marketing/call-insights/` (stale cross-agent read).
Some descriptions will still say "the other agents" (plural, a
lie in a single-agent world). This phase scrubs those.

#### 8a. Description rewrite

Skills descriptions = user-facing use cases in the Job Description
→ Skills sub-tab. They are NOT internal agent-routing text.
Rewrite anything that fails these rules:

1. **Second person.** "Use when **you** say…" — not "Use when
   **the user** says…".
2. **Named tools, not slugs.** "Semrush", "Google Docs", "X",
   "Customer.io", "ChatGPT" — NOT `googledocs`, `twitter`,
   `customerio`.
3. **No "via Composio (slug / slug)".** Just name the tool
   ("via Semrush or Ahrefs"). Composio is the transport — the
   founder doesn't care.
4. **Concrete outcome with file path.** "Writes to
   `{artifact}/{slug}.md` — {one-line hint of what's different}."
5. **No stale cross-agent language.** "the other marketing
   agents", "the SEO agent", "hand to Social & Community" — cut
   or rewrite as "every other skill" or "this agent's own
   output."
6. **2-3 sentences, ~300-450 chars.** Anything longer is a skill
   body, not a description.

**Grep sweep before committing:**

```bash
grep -l 'via Composio (' agents/{vertical}/.agents/skills/*/SKILL.md
# → should return 0 lines
grep -l 'the user says' agents/{vertical}/.agents/skills/*/SKILL.md
grep -l 'other {vertical} agents' agents/{vertical}/.agents/skills/*/SKILL.md
grep -rn '\.\./[a-z-]\+/' agents/{vertical}/.agents/skills/
# all → 0
```

Rewrite descriptions via a Python script with a manual-authored
`(skill-name → new-description)` map (see Appendix B —
`fix_unified_descriptions.py`). Emit as YAML double-quoted so
colons, apostrophes, slashes, and em-dashes inside the
description can't break YAML parse.

#### 8b. Integrations field

Every skill that genuinely benefits from a connected tool declares
`integrations: [slug, slug, slug]` in frontmatter. **Verified
Composio slugs only** — Appendix A.

- 2-4 slugs per skill (not 10).
- Most common providers in the category (Gmail + Outlook for
  inbox, not every ESP on earth).
- **Omit the field** for skills that are genuinely internal:
  pure planning, pure text editing, cross-skill review. Don't
  fake integrations.

Verify slugs with `composio search "<category>"` before committing.

#### 8c. Frontmatter sanity

Every SKILL.md opens with:

```
---
name: {kebab-case-id}
description: "Use when you say '…' — …"
integrations: [slug, slug]   # optional
---
```

- `name` matches the folder name.
- Description starts with `"Use when you say`.
- Integrations is inline YAML `[a, b, c]`.
- Body starts with `# {Title Case Skill Name}` H1.

---

### Phase 9 — Workspace packaging

Update `simplified-verticals/` root:

1. **`workspace.json`** — append the new agent id:
   `{ "agents": ["marketing", "{new-vertical}"] }`
2. **`README.md`** — add a row to the agents table (who it's
   for, good first prompt). Match existing style.

---

### Phase 10 — Commit & push

One commit for the whole unification — not one-per-phase. Commit
message template:

```
feat: add unified {Vertical} agent to simplified-verticals

First {vertical} simplified agent — consolidates the full surface
of {source-workspace-name}'s N-agent team behind one conversation
and one context ledger.

- {N-total} skills (M ported 1:1 + K consolidated behind a param):
    {consolidated-skill-1} ({param}: {opt, opt, opt})
    ...

- Adaptive onboarding via config/context-ledger.json — no upfront
  question pass.

- Overview: {tile-count} tiles across {chip-count} domain chips.

- {routine-count} routines seeded:
    {cadence-1} — {routine-1}
    ...

Design reference: verticals-store/UNIFYING-A-VERTICAL.md
Worked example: verticals-store/simplified-verticals/agents/marketing/

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

Then `git push origin main` in the `simplified-verticals/` repo.

---

## Hard rules (one-page summary — pin this)

1. **Every cross-agent path in the source becomes a local path
   in the unified.** `../{agent}/outputs.json` → `outputs.json`.
2. **Drop every `onboard-me`.** Ledger + just-in-time replaces it.
3. **One context ledger** at `config/context-ledger.json`. Every
   skill reads it first. Never asks the same field twice.
4. **Every skill description is second-person, user-facing,
   named-tools.** If it reads like internal routing, rewrite.
5. **`fullPrompt` names the skill + param.** That's how the
   agent routes deterministically from a tile click.
6. **Categories in `useCases` match chip labels exactly.**
   Orphans are a bug.
7. **4 routines max.** Monday review + weekly pulse + 2 monthly
   audits. Cut daily, cut redundant, cut single-user-dependent.
8. **Bundle is hand-crafted IIFE** — no JSX, no imports, React
   via `window.Houston.React`. Keep `useHoustonEvent` literal for
   the grep check.
9. **Composio slugs are verified** — run
   `composio search <category>` before committing.
10. **Descriptions max ~450 chars.** Anything longer is a body.

---

## Failure modes I hit (avoid them)

- **Subagent writes "the user says…"** instead of "you say…".
  Always grep in Phase 8a.
- **Subagent writes "via Composio (googledocs / twitter / …)"**
  listing raw slugs. Rewrite to named tools.
- **Port script misses paths in skill BODIES (not just
  frontmatter).** Caught `generate-ad-copy` /
  `write-cta-variants` / `write-headline-variants` referencing
  `../head-of-marketing/call-insights/` after the first port
  pass. Grep sweep catches it.
- **`plan-social-calendar` referenced "the SEO agent's outputs"**
  — stale copy from multi-agent. Always grep for "the {Role}
  agent" patterns.
- **`houston.json` `agentSeeds` values forgotten to be
  strings.** They must be JSON **strings**, not objects.
  `json.dumps` the inner content, embed as a string value.
- **Bundle.js using Tailwind classes that aren't in Houston's
  output CSS.** Inject a `<style>` block with literal rules.
- **Routine prompt duplicating `ROUTINE_OK`.** The engine
  appends it. Don't write it.
- **Shipping a daily routine.** Founders ignore it within 3
  days.
- **Consolidated skills without naming the param in
  `fullPrompt`.** The agent guesses which branch to run and
  picks wrong. Spell it out: `"…Use the audit skill with
  surface=site-seo…"`.
- **Putting `{vertical}-context.md` in `.agents/` or
  `.houston/`.** The Houston watcher skips both. Use `context/`.

---

## Appendix A — Verified Composio toolkit slugs

Probe with `composio search "<query>"` if you need one not on
this list. As of 2026-04-24:

**Inbox / calendar:** `gmail`, `outlook`, `googlecalendar`
**CRM:** `hubspot`, `salesforce`, `attio`, `pipedrive`, `close`
**Meetings / calls:** `gong`, `fireflies`
**Search / research:** `exa`, `perplexityai`
**Web scrape / crawl:** `firecrawl`
**SEO:** `semrush`, `ahrefs`
**Docs / notes:** `googledocs`, `notion`, `airtable`
**Files:** `googledrive`, `googlesheets`
**ESP:** `mailchimp`, `customerio`, `loops`, `kit`
(ConvertKit's rebrand), `klaviyo`
**Ads:** `googleads`, `metaads`, `facebook`, `linkedin`
**Analytics:** `posthog`, `mixpanel` (no dedicated `ga4`
toolkit — use custom or Firecrawl scrape)
**Billing:** `stripe`
**Social:** `linkedin`, `twitter`, `reddit`, `instagram`,
`tiktok`
**Video:** `youtube`
**Podcasts:** `listennotes`
**Dev:** `github`, `gitlab`, `linear`, `jira`
**Messaging:** `slack`, `discord`, `microsoftteams`

**Not in Composio** (as of writing): `beehiiv`, `substack`,
`otter`, `amplitude`. Use close alternatives or note as scrape-
only.

---

## Appendix B — Scripts referenced

Every script referenced above lives in the unified-marketing
commit history of `simplified-verticals`. Copy-adapt them — the
regex substitutions and YAML emitters are vertical-agnostic.

- **`port_simple_skills.py`** — reads source SKILL.md files,
  applies cross-agent path rewrites, writes to target
  `.agents/skills/`. See commit `ebc0475`.
- **`fix_unified_descriptions.py`** — takes a `(skill-name →
  new-description)` map and rewrites the frontmatter
  `description:` line using YAML double-quoting. See `a666007`.
- **`seed_routines.py`** — builds the routines JSON and injects
  as a string into `houston.json.agentSeeds`. See `92f4256`.
- **`generate_marketing_bundle.py`** — bakes `useCases` from
  `houston.json` into the bundle.js template with filter chips.
  Adapt by changing `AGENT_NAME`, `tagline`, `CHIP_ORDER` only.

---

## Appendix C — Worked example paths

Reference freely:

- **Source (6-agent):** `verticals-store/founder-marketing-workspace/`
- **Target (1-agent):** `verticals-store/simplified-verticals/agents/marketing/`
- **Design spec:** `verticals-store/founder-marketing-unified-workspace/docs/specs/2026-04-24-unified-marketing-agent-design.md`
- **This playbook:** `verticals-store/UNIFYING-A-VERTICAL.md`
- **Sibling playbook (greenfield verticals):** `verticals-store/BUILDING-A-VERTICAL.md`
- **Routine authoring detail:** `verticals-store/ADD_ROUTINE_TO_AGENT.md`
- **Agent design principles (source):** `verticals-store/AGENT-DESIGN-PHILOSOPHY.md`

---

## Done criteria

The unification is done when:

- [ ] One agent dir at `simplified-verticals/agents/{vertical}/`.
- [ ] `workspace.json` lists the new agent.
- [ ] All frontmatter grep sweeps (Phase 8a) return zero
      matches.
- [ ] `composio search` verifies every slug in every
      `integrations:` line.
- [ ] Bundle loads via the Node shim; exports `Dashboard`.
- [ ] Every useCase `category` matches a chip; every `skill`
      value matches a real skill in `.agents/skills/`.
- [ ] 4-routine set seeded (or justified smaller).
- [ ] No cross-agent paths (`../{x}/`) anywhere in skill bodies.
- [ ] Committed + pushed to `simplified-verticals` remote.
- [ ] Installed cleanly in Houston; Overview tab renders the
      filter chip strip and tile grid; clicking any tile fires a
      chat message.

---

## If you finish and it feels wrong

Re-read the 7 principles at the top. The most common sources of
"it compiles but something's off":

- You kept too many skills as 1:1 ports instead of consolidating
  (re-read principle 4). A skill menu with 35 items is a menu the
  founder won't read.
- You preserved a "coordinator" skill that orchestrates others
  (re-read principle 1). In a unified agent, orchestration is
  inline — a skill doesn't hand off to another skill via a
  separate skill.
- You ported upfront capture into an `onboard-me` (re-read
  principle 3). There is no onboard-me. If you feel you need
  upfront capture, you're thinking about the 6-agent workspace.
- Your descriptions still read internal (re-read principle 5).
  Grep returned zero but the prose is dry. Read each description
  out loud as if you were the founder — if any word is jargon,
  rewrite.

If the playbook and the principles disagree, the principles win.
The playbook is a frozen execution of the principles at one point
in time; your vertical might need a variation. Commit the
variation with a note explaining why.
