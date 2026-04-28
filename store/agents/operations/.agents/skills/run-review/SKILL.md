---
name: run-review
description: "Use when you say 'Monday ops review' / 'weekly readout' / 'weekly metrics pulse'  -  I roll up what shipped and what moved. Pick `period`: `weekly` aggregates every skill's output last week, cross-references priorities + renewals, flags gaps, recommends next moves · `metrics-rollup` is the cross-metric week-over-week pulse (every tracked metric, WoW change, classification, open anomalies). Writes to `reviews/` or `rollups/`."
version: 1
tags: [operations, run, review]
category: Operations
featured: yes
image: clipboard
integrations: [googlesheets]
---


# Run Review

Cross-cutting Monday ritual. Two sub-reviews behind one primitive  -  usually want weekly review Mondays, wire metrics rollup into it.

## When to use

- `period=weekly`  -  "Monday ops review" / "weekly readout" / "what happened across my ops this week".
- `period=metrics-rollup`  -  "weekly metrics readout" / "how's the business doing this week" / "give me the data for the Monday review".

## Ledger fields I read

- `universal.positioning`  -  confirms `context/operations-context.md` exists (active priorities, rhythm).
- `domains.data.metrics`  -  metric registry (for `metrics-rollup`).
- `domains.investors.cadence`  -  so review flags upcoming investor-update or board deadlines.

Missing → ONE modality-ranked question → write to ledger → continue.

## Parameter: `period`

- `weekly`  -  founder's Monday review. Aggregates last 7 days of `outputs.json` across every skill in agent, cross-references active priorities + renewal calendar, flags gaps, surfaces next moves. Output: `reviews/{YYYY-MM-DD}.md`.
- `metrics-rollup`  -  cross-metric weekly pulse. Reads every tracked metric, computes week-over-week change, classifies vs direction, flags open anomalies. Feeds `weekly` review. Output: `rollups/{YYYY-MM-DD}.md`.

## Steps

1. Read `config/context-ledger.json`. Fill gaps with ONE modality-ranked question.
2. Read `context/operations-context.md`  -  active priorities, operating rhythm, key contacts, vendor posture, hard nos.
3. Branch on `period`:

   **If `period = metrics-rollup`:**
   - Read `config/metrics.json` for metric registry.
   - Each metric, read last 14 snapshots from `metrics-daily.json`.
   - Compute: this-week value, last-week value, WoW delta, WoW %, classification vs declared direction (improved / stable / degraded), note any open anomaly in `anomalies.json`.
   - Rank by biggest movement (absolute WoW%) first, then by priority (metrics tied to active priorities first).
   - Write rollup as scannable table + 2-3 sentence commentary on top 3 movers.

   **If `period = weekly`:**
   - Optionally read latest `rollups/{YYYY-MM-DD}.md` if present  -  if not, consider suggesting `metrics-rollup` run before review, don't block.
   - Scan `outputs.json` for every entry with `updatedAt` in last 7 days. Group by skill / domain.
   - Read `renewals/calendar.md`  -  flag anything renewing in next 30 days.
   - Read `bottlenecks.json` and `decisions.json` (last 30 days).
   - Produce review:
     - **What shipped**  -  by domain (Planning / People / Finance / Vendors / Data), bulleted with paths.
     - **What moved**  -  top 3 metric movers from rollup if available.
     - **What's stale**  -  things started but not touched 3+ weeks.
     - **Gaps vs priorities**  -  each active priority → what we did for it this week → honest verdict (on-track / at-risk / off-track).
     - **Upcoming deadlines**  -  renewals next 30d, investor updates due, board meetings.
     - **The one move**  -  single most useful thing to do this week.

4. Write atomically (`.tmp` → rename) to appropriate path.
5. Append to `outputs.json` with `{id, type, title, summary, path, status: "ready", createdAt, updatedAt, domain: "planning" or "data"}`. Type = `"weekly-review"` or `"metrics-rollup"`.
6. Summarize to you: one move (weekly) or top 3 movers (rollup).

## Outputs

- `reviews/{YYYY-MM-DD}.md` (weekly)
- `rollups/{YYYY-MM-DD}.md` (metrics-rollup)
- Appends to `outputs.json`.

## What I never do

- Claim progress on priority I can't evidence in `outputs.json`.
- Invent metric movement  -  if data missing, I say so.
- Replace decision ledger  -  if review surfaces decision-shaped item, flag as `log-decision` candidate; don't record as one.