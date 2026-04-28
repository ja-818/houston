---
name: analyze
description: "Use when you say 'Monday engineering review' / 'weekly PR health' / 'what shipped this week' / 'technical competitor pulse' / 'what did {competitor} ship'  -  I run the `subject` you pick: `engineering-health` rolls up everything this agent produced in the last 7 days (Shipped / In Progress / Blocked / Decisions Needed) · `pr-velocity` pulls the last 7 days of PRs from GitHub or GitLab and computes five DORA-lite metrics · `competitors` fetches engineering blogs, GitHub org activity, changelogs, and API diffs via Exa, Perplexity, or Firecrawl. Writes to `reviews/`, `pr-velocity/`, or `competitor-watch/`."
version: 1
tags: [engineering, analyze]
category: Engineering
featured: yes
image: laptop
integrations: [github, gitlab, firecrawl, perplexityai]
---


# Analyze

One skill, three subjects. `subject` param pick probe. Grounding against engineering context + "never invent metrics" shared.

## Parameter: `subject`

- `engineering-health`  -  weekly rollup of everything agent produced. Read `outputs.json`, window last 7 days, write 4-section narrative (Shipped / In Progress / Blocked / Decisions Needed) to `reviews/{YYYY-MM-DD}.md`.
- `pr-velocity`  -  DORA-lite on last 7 days of PRs. Five metrics: PRs merged, median cycle time, largest PR size, reviewer concentration, open-to-merge age. Write to `pr-velocity/{YYYY-Www}.md`.
- `competitors`  -  engineering competitor watch. Single-competitor teardown (deep) or N-competitor weekly digest (broader, shorter). Write to `competitor-watch/{slug}.md` or `competitor-watch/weekly-{YYYY-MM-DD}.md`.

User name subject plain English → infer. Ambiguous → ask ONE question naming 3 options.

## When to use

- Explicit: "Monday review", "how's engineering doing", "weekly PR health", "cycle time", "technical pulse", "teardown of {competitor}".
- Implicit (routine): Monday engineering health review + Friday PR velocity readout fire skill auto.
- Per-subject cadence: engineering-health weekly, pr-velocity weekly, competitors weekly (digest) or on demand (teardown).

## Ledger fields I read

Read `config/context-ledger.json` first.

- `universal.engineeringContext`  -  required all subjects. Missing: "want me to draft your engineering context first? (one skill, ~5m)" and stop.
- `universal.priorities`  -  all subjects use to frame relevance.
- `domains.reliability.cicd.provider`  -  `pr-velocity` use to find connected code host (GitHub / GitLab / etc.). Ask ONE question if missing.
- `domains.development.sensitiveAreas`  -  `pr-velocity` use to flag large PRs touching them; `competitors` use to rank threats.

## Steps

1. **Read ledger + engineering context.** Gather missing required fields per subject (ONE question each, best-modality first). Write atomically.

2. **Discover tools via Composio.** For `pr-velocity` + `competitors`, run `composio search code-hosting` and `composio search web-scrape` / `composio search web-search`. Required category no connection → name it, stop.

3. **Branch on subject.**

   - `engineering-health`:
     - Read `outputs.json` at agent root.
     - Filter to review window (default 7 days; honor user "last 2 weeks" / "since the launch").
     - Group by `domain` (planning / triage / development / reliability / docs). Per domain compute: count by `type`, notable shipped items (top 3 by recency, title + path + status), stale drafts (status "draft", >7 days idle), gaps (e.g. incident no postmortem, new feature no tutorial/changelog, design-doc no release plan).
     - Cross-cutting: release-plan drift (open `release-plans/{slug}.md` whose dependent artifacts missing), un-actioned competitor threats, feature-fit verdicts never landed on roadmap, roadmap items zero activity.
     - Write 4-section narrative to `reviews/{YYYY-MM-DD}.md`: Window + TL;DR · Shipped · In Progress · Blocked · Decisions Needed (prioritized, each paste-ready follow-up prompt). Close with per-domain table: domain · outputs shipped · drafts open · last activity · status (active / quiet / missing).

   - `pr-velocity`:
     - Pull last 7 days merged + currently-open PRs from connected code host via discovered slug.
     - Compute: (1) PRs merged, (2) median cycle time open→merge, (3) largest PR size lines changed, (4) reviewer concentration (share on top reviewer), (5) open-to-merge age of currently-open PRs.
     - First run: establish rolling baseline in `pr-velocity/baseline.json` across last 4 weeks history (or whatever available). Compare every next run against it.
     - One-line diagnosis per anomaly (cycle-time ≥ 50% over baseline, largest PR > 1000 lines, reviewer concentration > 80%, open PR > 14 days old). Flag large PR touching `sensitiveAreas` as "review escalate". Write to `pr-velocity/{YYYY-Www}.md`.

   - `competitors`:
     - Mode: single competitor → teardown; N competitors or "weekly pulse" → digest. Default top 3 from engineering context doc or ledger.
     - Gather per competitor (last 7 days for digest, 30 days for teardown): engineering blog posts (title + 1-line summary + URL + date), GitHub org releases + notable commits + star delta, public changelog, API diffs (OpenAPI or versioned REST/GraphQL docs). Optional: conference talks, job-post hints.
     - Per signal ask: threaten top-3 priority? expose gap to press? parity to match?
     - Teardown structure (~500-800 words): summary · what's new · engineering-blog claims · GitHub activity · API / schema diffs · technical threats (ranked) · opportunities (ranked) · recommended moves (3 one-week actions tagged with in-agent skill owning each  -  `[plan-roadmap]` / `[draft-design-doc]` / `[draft-runbook]` / etc.) · sources.
     - Digest structure (~300-500 words): headline table (competitor · top signal · threat? · opportunity?) · per-competitor bullets · cross-cutting pattern · 3 recommended moves tagged with owning in-agent skill · sources.

4. **Never invent metrics, commit counts, competitor moves.** Every claim ties to URL + timestamp, real API response, or marked `UNKNOWN`.

5. **Write** atomically to target path (`*.tmp` → rename). Paths:
   - `engineering-health` → `reviews/{YYYY-MM-DD}.md`.
   - `pr-velocity` → `pr-velocity/{YYYY-Www}.md`.
   - `competitors` → `competitor-watch/{competitor-slug}.md` (teardown) or `competitor-watch/weekly-{YYYY-MM-DD}.md` (digest).

6. **Append to `outputs.json`**  -  read-merge-write atomically: `{ id (uuid v4), type, title, summary, path, status, createdAt, updatedAt, domain }`. Type: `"review"` for engineering-health, `"pr-velocity"` for pr-velocity, `"competitor"` for competitors. Domain: `"planning"` for engineering-health + competitors, `"development"` for pr-velocity. Status `"ready"` for reviews + velocity, `"draft"` for competitor teardowns.

7. **Summarize to user.** One paragraph: biggest finding + decision needed + path. `engineering-health` lead with single biggest decision. `pr-velocity` lead with one anomaly or "all green vs baseline." `competitors` lead with biggest technical threat + one move this week.

## What I never do

- Invent metrics. Tracking data thin → mark UNKNOWN. No DORA-dashboard fabrication.
- Invent competitor commit counts, release dates, API diffs. Every claim → URL + timestamp or UNKNOWN.
- Overwrite `reviews/` / `pr-velocity/` / `competitor-watch/`  -  every run writes new dated file.
- Hardcode tool names  -  Composio discovery at runtime only.

## Outputs

- `reviews/{YYYY-MM-DD}.md` (engineering-health)
- `pr-velocity/{YYYY-Www}.md` + `pr-velocity/baseline.json` (pr-velocity)
- `competitor-watch/{competitor-slug}.md` or `competitor-watch/weekly-{YYYY-MM-DD}.md` (competitors)
- Append entry to `outputs.json` per run.