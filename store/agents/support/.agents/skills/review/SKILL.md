---
name: review
description: "Use when you say 'Monday review' / 'weekly readout' / 'help-center digest' / 'prep QBR for {account}'  -  I produce the `scope` you pick: `weekly` (rollup across domains + next moves) · `help-center-digest` (volume, themes, unresolved high-priority) · `qbr` (4-section review: wins / asks-shipped / friction / next). Writes to `reviews/` · `digests/` · `qbrs/`."
version: 1
tags: [support, review]
category: Support
featured: yes
image: headphone
integrations: [googledocs, notion, slack]
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Review

One skill for rollup / readout / review. Branches on `scope`.

## When to use

- **weekly**  -  "Monday review" / "weekly support readout" / "how
  was support week?" / Monday cron routine.
- **help-center-digest**  -  "weekly help-center digest" / "what
  happened in docs this week?" / Sunday cron routine.
- **qbr**  -  "prep QBR for {account}" / "outline for check-in
  with {customer}."

## Ledger fields I read

- `universal.positioning`  -  product surface + plan-tier map.
- `domains.success.qbrSegment`  -  segment worth QBRs.
- `domains.quality.reviewCadence`  -  weekly vs biweekly vs monthly.

If required field missing, ask ONE targeted question, write
it, continue.

## Parameter: `scope`

- `weekly`  -  rollup across all domains. Volume, top themes,
  unresolved high-priority, churn flags opened, promises due
  this week, next moves grouped by domain. Writes to
  `reviews/{YYYY-MM-DD}.md`.
- `help-center-digest`  -  docs-specific rollup. Ticket volume, top
  3 themes from `patterns.json`, unresolved high-priority items,
  feature-request velocity, churn flags. Writes to
  `digests/{YYYY-MM-DD}.md`.
- `qbr`  -  per-account quarterly review. 4 sections: wins (what
  achieved), asks-shipped (requests I shipped), friction
  (still-open pains), next moves (renewal / expansion /
  investment). Writes to `qbrs/{account}-{YYYY-MM-DD}.md`.

## Steps

1. **Read `context/support-context.md`.** If missing, stop.
2. **Read ledger.** Fill gaps.
3. **Branch on `scope`:**
   - `weekly`: read `outputs.json` filtered to last 7 days.
     Group by `domain`. Per domain: count + 1-line headline +
     1 unresolved. Read `followups.json` filtered to due this week.
     Read `churn-flags.json` filtered to opened this week. End with
     "2–3 things I recommend you do this week" across whole
     agent.
   - `help-center-digest`: read `conversations.json` counts for
     window, `patterns.json` top 3 themes, `requests.json`
     velocity, `known-issues.json` state changes. Surface
     single most useful docs gap to write next.
   - `qbr`: chain `customer-view view=timeline` for account.
     Read `requests.json` + `bug-candidates.json` + `followups.json`
     filtered to account. Structure doc as wins /
     asks-shipped / friction / next moves, each section grounded
     in timeline + request IDs.
4. **Write artifact** atomically.
5. **Append to `outputs.json`** with `type` =
   `weekly-review` | `help-center-digest` | `qbr`,
   `domain: "quality"` (for `weekly` / `help-center-digest`) or
   `domain: "success"` (for `qbr`), title, summary, path.
6. **Summarize to me**: 2-minute scan. For `weekly` / `digest`,
   always surface  -  quiet week also news.

## Outputs

- `reviews/{YYYY-MM-DD}.md` (for `scope = weekly`)
- `digests/{YYYY-MM-DD}.md` (for `scope = help-center-digest`)
- `qbrs/{account}-{YYYY-MM-DD}.md` (for `scope = qbr`)
- Appends to `outputs.json`.

## What I never do

- Invent numbers to pad quiet week. Low volume, write it.
- Include "next moves" without grounding in specific output
  or ticket id.