---
name: score-ticket-priority
description: "Use when you say 'score this ticket' / 'RICE this' / 'MoSCoW these tickets' / 'is this worth doing'  -  I apply RICE (Reach × Impact × Confidence / Effort) or MoSCoW (Must / Should / Could / Won't) on a single ticket or a list, with one-line reasoning per axis, and a final ranking. Writes to `priority-scores/{slug}.md`."
version: 1
tags: [engineering, score, ticket]
category: Engineering
featured: yes
image: laptop
integrations: [github, linear, jira]
---


# Score Ticket Priority

RICE or MoSCoW on one ticket or list. Every axis gets one-line rationale. Output = defensible table, not vibe check.

## When to use

- User: "score this ticket" / "RICE {ticket}" / "MoSCoW these tickets" / "is this worth doing" / "rank these {n} tickets".
- Before sprint planning when in-list too long.

## Steps

1. **Read engineering context**  -  `context/engineering-context.md`. If missing or empty, say: "I need the engineering context doc first. Scoring without priorities is arbitrary. Run the `define-engineering-context` skill (5 minutes), then come back." Stop.
   Extract: top-3 current priorities, ICP / user-surface notes, any stated reach denominators (MAU, WAU, paying-seats  -  anything known).
2. **Read `config/scoring-defaults.json`** if present  -  RICE reach units (monthly active users vs. total users vs. paid accounts) and per-axis weight tweaks. If missing, ask once: "For RICE reach, do you want to measure against monthly active users, total accounts, or paying accounts? I'll save it for future scorings." Write and continue. (Skip ask if framework MoSCoW.)
3. **Confirm framework.** If user specified RICE or MoSCoW, honor it. If unspecified, default RICE and note why in output ("You didn't pick  -  defaulting to RICE because it produces a sortable number. Switch with 'MoSCoW these' anytime.").
4. **Gather tickets.** Accept inline paste, ticket URL, or list of ticket IDs. If user gave ticket IDs and tracker connected, fetch each via Composio (`composio search <issue-tracker>` → list-issue-by-id). Capture title, body, labels, linked PRs.
5. **For RICE**  -  score each ticket on four axes:
   - **Reach** (people affected per time window, in reach units)  -  rationale cites denominator and evidence from engineering context.
   - **Impact** (0.25 / 0.5 / 1 / 2 / 3  -  minimal / low / medium / high / massive).
   - **Confidence** (%, 50/80/100)  -  high if evidence exists; low when guessing. Name evidence (or absence).
   - **Effort** (person-months or person-weeks  -  match team scale).

   Score = `Reach × Impact × Confidence / Effort`. Rank list descending by score.

6. **For MoSCoW**  -  sort each ticket into Must / Should / Could / Won't. Rationale per ticket names priority it serves (or doesn't). Put low-alignment tickets in **Won't** explicitly  -  framework only useful when honest about "Won't" bucket.
7. **Write** `priority-scores/{slug}.md` atomically (`.tmp` → rename). Slug: single-ticket → `{ticket-id}-{tag}.md`; list → `{topic-or-date}-{framework}.md`. Structure for RICE:

   ```markdown
   # Priority score  -  RICE  -  {topic}

   **Reach unit:** {MAU / paying-accounts / etc.}

   | Ticket | Reach | Impact | Confidence | Effort | Score | Notes |
   |---|---|---|---|---|---|---|
   | [ID] Title | 1,200 MAU | 1 | 80% | 3 pw | 320 | {one-line} |

   ## Per-axis reasoning

   ### [ID] Title  -  score {N}
   - **Reach:** {rationale, cites evidence}
   - **Impact:** {rationale}
   - **Confidence:** {rationale + evidence}
   - **Effort:** {rationale}
   ```

   For MoSCoW: 4 sections (Must / Should / Could / Won't), each bulleted list of tickets with one-line rationales.

8. **Append to `outputs.json`**  -  type `"priority-score"`, status `"draft"`, 2-3-sentence summary naming framework, N scored, top item. Read-merge-write atomically.
9. **Summarize to user**  -  one paragraph: "Scored {N} tickets with {framework} at {path}. Top: {name + score}. **The scores are drafts  -  edit effort / confidence where I'm wrong and re-run.**" For lists, offer next step: "Want me to feed top 3 into `plan-sprint`?"

## Hard nos

- Never score without reading engineering context. Scoring without priorities = priority theater.
- Never invent Confidence number  -  if evidence thin, say "50%  -  no user data, author's gut" explicit.
- Never write back to tracker. Score = markdown.

## Outputs

- `priority-scores/{slug}.md`
- Appends to `outputs.json` with `{ id, type: "priority-score", title, summary, path, status: "draft", createdAt, updatedAt }`.