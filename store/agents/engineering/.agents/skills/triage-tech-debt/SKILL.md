---
name: triage-tech-debt
description: "Use when you say 'rank the tech debt' / 'what's rotting' / 'refresh the debt list' / 'tech debt review'  -  I maintain a single running `tech-debt.md` at the agent root with area, problem, impact (1-5), effort (S/M/L/XL), and suggested next step per entry, sorted by impact / effort (highest value first). Read-merge-write  -  never wholesale-overwrite."
version: 1
tags: [engineering, triage, tech]
category: Engineering
featured: yes
image: laptop
integrations: [github, gitlab]
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Triage Tech Debt

## When to use

- Explicit: "rank the tech debt", "what's rotting", "refresh
  tech-debt list", "triage debt", "top tech-debt items".
- Implicit: after new audit or rough week of incidents, user
  asks "what fix next".
- Run weekly to quarterly  -  doc is living inventory, not
  point-in-time report.

## Steps

1. **Read engineering context**:
   `context/engineering-context.md`. If missing,
   tell user run `define-engineering-context` first and stop.
   Impact scoring needs actual stack + current priorities.
2. **Read config**: `config/stack.json` and
   `config/sensitive-areas.md`. Debt in sensitive areas auto-scores
   min impact 3 (medium-high)  -  regressions costly here.
3. **Read existing `tech-debt.md` at agent root** if exists.
   Parse every entry into in-memory list (preserve `id`,
   `createdAt`). If file missing, start fresh.
4. **Gather new debt candidates.** Sources, in order:
   - Recent `architecture-audits/*.md`  -  high/medium findings not
     yet in debt list.
   - Recent `pr-reviews/*.md`  -  `merge-with-changes` / `hold`
     patterns recurring across PRs.
   - Anything user named directly in this conversation.
   - Optional: `composio search issue-tracker` to read tickets
     tagged `tech-debt` / `refactor` / `chore`.
5. **Score each entry** on impact (1-5) and effort (S / M / L / XL).
   Impact considers: user-facing risk, blast radius, blocks-other-work,
   sensitivity. Effort is engineering-hours gut feel.
6. **Merge, dedupe, sort.** For each new candidate, check if
   already in list (by area + problem). If yes, update (refresh
   `updatedAt`, adjust impact/effort if changed). If no, add with
   new `id` and `createdAt`. Sort final list by
   `impact / effort-weight` descending  -
   highest-value-per-hour items first. Effort weights: S=1, M=2,
   L=4, XL=8.
7. **Write `tech-debt.md`** at agent root atomically (`*.tmp`
   → rename). Structure:
   - Header with last-updated date.
   - Markdown table OR section-per-entry. Each entry carries:
     `id` (short), `area`, `problem`, `impact`, `effort`,
     `suggested next step`, `createdAt`, `updatedAt`.
   - "Top 3 next week" callout at top  -  three highest
     impact-per-effort items.
8. **Append to `outputs.json`**  -  if no `tech-debt` entry exists,
   create one. If exists, update `updatedAt` and refresh
   `summary` (total items + top 3).
   `{ id, type: "tech-debt", title: "Tech Debt Inventory", summary,
   path: "tech-debt.md", status: "ready", createdAt, updatedAt }`.
9. **Summarize to user**  -  top 3 next week, count of new
   items merged, and path.

## Never invent

Every debt item ties to real file, system, PR, or incident. If
item speculative, mark as such and drop impact score.
Never wholesale-overwrite `tech-debt.md`  -  always read-merge-write.

## Outputs

- `tech-debt.md` (at agent root, living doc)
- Updates `outputs.json` with type `tech-debt` (single entry,
  updated in place).