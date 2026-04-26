---
name: gap-surface
description: "Use when you say 'what should I write docs for?' or on the weekly help-center cron  -  I rank open docs gaps from `patterns.json` by impact (volume × customer tier), return the top 3 with source ticket ids, and offer to chain into `write-article type=from-ticket` for any you pick. Writes to `gaps/{YYYY-MM-DD}.md`."
version: 1
tags: [support, gap, surface]
category: Support
featured: yes
image: headphone
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Gap Surface

## When to use

- Ask: "what should I write docs for?", "what gaps do we have?", "what's missing from help center?".
- Weekly cadence  -  usually paired with or before `review scope=help-center-digest`.
- After `detect-signal signal=repeat-question` find new clusters worth review.

## Ledger fields I read

- `domains.help-center.platform`  -  check if existing articles already cover candidate gap before rank.

Required field missing → ask ONE targeted question with modality hint, write, continue.

## Steps

1. Read `patterns.json` (clusters of repeat questions) and `articles/` (existing KB). Filter patterns without matching article.
2. List empty → run `detect-signal signal=repeat-question` first (or tell me just ran, nothing yet).
3. Rank each open gap by impact score:
   - `occurrenceCount`  -  primary signal (how often asked)
   - **Customer value**  -  each `sourceTicketId`, lookup customer in `customers.json`, weight by plan tier / MRR if present (fallback: equal weight)
   - **Freshness**  -  recent occurrences beat stale; heavy penalize gaps with no hits in last 14 days
4. Present top 3 gaps in chat:
   ```
   1. "How do I reset my API key?"  -  7 occurrences, 3 paying customers, latest 2 days ago
      Source tickets: t_abc, t_def, t_ghi
   2. ...
   3. ...
   ```
5. Ask: "Want me to draft articles for any of these? Reply with the numbers (e.g. '1 and 3')."
6. Each number picked, pick representative source ticket (most recent, or clearest resolution) and chain to `write-article type=from-ticket`.
7. Write ranking snapshot to `gaps/{YYYY-MM-DD}.md`, append entry to `outputs.json` with `type: "docs-gap"`, `domain: "help-center"`.
8. Gap promoted to article → refresh `patterns.json` entry with `relatedArticleSlug` so won't re-surface.

## Outputs

- `gaps/{YYYY-MM-DD}.md` (ranked list of top 3)
- Updates `patterns.json` (relatedArticleSlug on promotion)
- May chain to `write-article type=from-ticket` (one call per accepted gap)
- Appends to `outputs.json` with `type: "docs-gap"`, `domain: "help-center"`.