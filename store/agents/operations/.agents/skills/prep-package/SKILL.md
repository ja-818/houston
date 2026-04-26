---
name: prep-package
description: "Use when you say 'prep the Q{N} board pack' / 'draft the monthly investor update' / 'assemble the {quarter} investor letter'  -  I draft the package you need. Pick `type`: `board-pack` is the standard 8-section deck (TL;DR, business update, metrics, OKRs, wins, challenges, asks, appendix) · `investor-update` is the monthly or quarterly CEO-voice narrative grounded in OKR movement, decisions, and metrics. Both flag every TBD."
version: 1
tags: [operations, prep, package]
category: Operations
featured: yes
image: clipboard
integrations: [googledocs, googledrive, notion]
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Prep Package

One skill, two founder-voice artifacts  -  board pack and investor update. Both opinionated assembly on data you have: OKRs, decisions, metrics, wins, challenges.

## When to use

- `type=board-pack`  -  "prep the Q{N} board pack" / "build the {yyyy-qq} board pack" / board meeting 2+ weeks out per investor cadence.
- `type=investor-update`  -  "draft the monthly investor update" / "write the Q{N} investor letter" / update due per cadence.

## Ledger fields I read

- `universal.company`  -  name, website, 30s pitch, stage (frames update).
- `universal.voice`  -  CEO-voice narrative sounds like you.
- `universal.positioning`  -  confirms `context/operations-context.md` exists.
- `domains.investors.cadence`  -  monthly / quarterly / both; investor list + preferred format.
- `domains.investors.reportingPeriod`  -  anchors timeframe for metric pulls.

Missing fields → ONE targeted question with modality hint (connected app > file > URL > paste) → write to ledger → continue.

## Parameter: `type`

- `board-pack`  -  8-section deck draft for quarterly board meeting. Output: `board-packs/{yyyy-qq}/board-pack.md` (+ optional Google Doc mirror via Composio if connected).
- `investor-update`  -  CEO-voice narrative for monthly or quarterly update. Output: `investor-updates/{yyyy-qq}/update.md`.

## Steps

1. Read `config/context-ledger.json`. Fill gaps with ONE modality-ranked question.
2. Read `context/operations-context.md`  -  active priorities, operating rhythm, hard nos, voice notes. Anchors what "progress" means.
3. Gather source data:
   - Latest OKR snapshot from `okr-history.json` (from `track-okr`). Compute movement vs prior period.
   - Decisions in `decisions.json` + per-decision notes in `decisions/{slug}/` within reporting period.
   - Metric values from `metrics-daily.json` (from `track-metric`) and `rollups/` (from `run-review period=metrics-rollup`).
   - Weekly reviews in `reviews/` for period.
   - Open anomalies from `anomalies.json`.
   - Bottlenecks from `bottlenecks.json`.

4. Branch on `type`:

   **If `type = board-pack`:**
   - Draft 8-section pack:
     1. **TL;DR**  -  one page, 3-5 bullets: biggest movement, biggest ask, biggest risk.
     2. **Business update**  -  narrative, 300-500 words. Shipped, matters, next.
     3. **Metrics**  -  table of tracked metrics: current / prior-period / direction / commentary.
     4. **OKRs**  -  KR-level status (on-track / at-risk / off-track) with root cause for off-track.
     5. **Wins**  -  3-5 specific wins, each with metric or decision anchor.
     6. **Challenges**  -  2-4 specific challenges, each with hypothesis and what we're trying.
     7. **Asks**  -  explicit board asks (intros, advice, decisions).
     8. **Appendix**  -  links to decision records, detailed queries, weekly reviews.
   - Flag every unfilled field with `TBD  -  {what you need to bring}`. Never invent numbers.

   **If `type = investor-update`:**
   - Draft CEO-voice narrative (~600-900 words):
     - Opening: one paragraph, stage + what's true today.
     - Highlights: 3-5 bullets of movement (metric / decision / launch).
     - Lowlights: 1-2 honest items with mitigation.
     - KR status block: one-line per KR with direction.
     - Asks: 2-3 specific items  -  intros, advice, sounding-board time.
     - Closing: one paragraph, next-period focus.
   - Voice-match against `config/voice.md` + priorities from `context/operations-context.md`.
   - Flag every TBD.

5. Write atomically (`.tmp` → rename) to path.
6. If `googledocs` or `notion` connected and opted in, mirror draft to preferred format with link back.
7. Append to `outputs.json` with `{id, type, title, summary, path, status: "draft", createdAt, updatedAt, domain: "planning"}`. Type = `"board-pack"` or `"investor-update"`.
8. Summarize: path + every flagged TBD + one thing to review first (e.g. "Challenges section  -  pricing-page drop hypothesis is mine, not yours; sanity-check before sending").

## Outputs

- `board-packs/{yyyy-qq}/board-pack.md` (+ optional Google Doc mirror).
- `investor-updates/{yyyy-qq}/update.md` (+ optional Google Doc mirror).
- Appends to `outputs.json`.

## What I never do

- Send, publish, share. Drafts only  -  you review, edit, send.
- Invent metrics, quotes, or movement without evidence. TBD not failure, it's honest state.
- Promise outcomes. "We'll hit {KR} by {date}" → only if you said it.
- Touch investor records in CRM.