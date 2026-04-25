---
name: plan-sprint
description: "Use when you say 'plan this week's sprint' / 'plan the next cycle' / 'what's in the sprint' — I pull open tickets from Linear, Jira, or GitHub Issues, rank against priorities in engineering context, produce time-boxed plan with top-N in (rationale), top-M cut (rationale), velocity check vs prior sprints, key dependencies, risks. Writes to `sprints/{YYYY-WNN}.md`."
integrations:
  dev: [linear, jira, github]
---

# Plan Sprint

One written plan per sprint. Short. Defensible. Not novel.

## When to use

- User: "plan this week's sprint" / "plan next week" / "plan next cycle" / "what's in this sprint" / "plan ShapeUp pitch bucket".
- At start of sprint, cycle, or planning rhythm.

## Steps

1. **Read engineering context** — `context/engineering-context.md`. If missing or empty, say: "I need engineering context doc first. Run Head of Engineering's `define-engineering-context` (5 minutes), then come back." Stop. Extract: top-3 current priorities, quality bar items, known invariants.
2. **Read `domains.planning.cadence` from context ledger (`config/context-ledger.json`).** If missing, ask once: "Quick — cadence? Weekly sprints, 2-week sprints, ShapeUp 6-week cycles, continuous flow, or custom?" Write to ledger atomically and continue.
3. **Read `domains.planning.tracker` from ledger.** If missing, ask ONE question: "Which tracker — Linear, Jira, GitHub Issues, ClickUp, Asana, or Notion?" Write and continue.
4. **Read last 2-3 sprint files** at `sprints/*.md` for velocity context. For each past sprint capture: N tickets planned, N tickets shipped (marked ready / done in old artifact's summary if present), themes. Lightweight — don't compute DORA metrics.
5. **Optionally read** `pr-velocity/` — if present, use actual PR throughput numbers to sanity-check velocity. Graceful on miss.
6. **Optionally read** `tech-debt.md` — if present, surface top 1-2 debt entries aligned with current priorities for sprint consideration. Graceful on miss.
7. **Pull candidate tickets via Composio.** Use list-issues tool for connected tracker; filter to `open` + not-yet-in-sprint (or tracker's convention). Include pasted tickets if user dropped list inline.
8. **Rank candidates.** Score each by alignment with named priority from engineering context. Ticket not citing priority lands in "cut" unless in-flight unblock.
9. **Pick in-scope (top-N).** Default N = 5-8 for weekly sprint, 8-12 for 2-week sprint, 3-6 bets for ShapeUp cycle, or "next 5 most aligned" for continuous flow. Adjust against velocity from step 4 — never plan 3x last sprint's throughput without flagging.
10. **Pick out-of-scope (top-M).** 3-5 highest-signal cuts with one-line rationale each ("deferred to next sprint — depends on OAuth migration landing first"). Naming cuts as important as naming adds.
11. **Write** `sprints/{YYYY-Www}.md` atomically (`.tmp` → rename). Structure:

    ```markdown
    # Sprint plan — {ISO-week or cycle name}

    **Cadence:** {cadence}. **Velocity last sprint:** {planned}/{shipped} ({%}).

    ## In — top {N}
    - [TICKET-ID] Title — priority alignment / rationale. Dependencies: {...}

    ## Cut — top {M}
    - [TICKET-ID] Title — why it's out this sprint.

    ## Velocity check
    {one paragraph: projected load vs last sprint's throughput; flag over/under}

    ## Key dependencies
    - {named dep → ticket it unblocks}

    ## Risks
    - {risk → likelihood → mitigation, one line each}
    ```

12. **Append to `outputs.json`** — type `"sprint"`, status `"draft"`, 2-3-sentence summary naming cadence, in-count, top theme. Read-merge-write atomically.
13. **Summarize to user** — one paragraph: "Sprint plan at {path}. Top theme: {theme}. {N} in, {M} cut, velocity {up/down/flat} vs last. Edit before Monday — **I don't file or start tickets myself.**"

## Hard nos

- Never invent priorities. If engineering context priorities section thin, flag it and list what I'd need to plan better.
- Never over-pack sprint past observed velocity × 1.5 without flagging as risk.
- Never file or start tickets in tracker — plan is markdown; you move things in tracker yourself.

## Outputs

- `sprints/{YYYY-Www}.md`
- Appends to `outputs.json` with `{ id, type: "sprint", title, summary, path, status: "draft", createdAt, updatedAt }`.