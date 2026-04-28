---
name: log-decision
description: "Use when you say 'we decided {X}' / 'log the decision on {Y}' / 'capture the call we just made'  -  I write an ADR-style record with context, alternatives, trade-offs, decision, rationale, consequences, and links. Creates `decisions/{slug}/decision.md` and appends to `decisions.json`."
version: 1
tags: [operations, log, decision]
category: Operations
featured: yes
image: clipboard
integrations: [linkedin]
---


# Log Decision

## When to use

- User says "we decided", "log the decision on", "capture that call", "ADR this".
- Pasted/connected meeting notes contain clear decision pattern.
- User asks review open decision backlog  -  skill also marks `pending` rows `decided` when user declares them.

## Steps

1. **Read `context/operations-context.md`.** If missing or empty, stop and ask user run Head of Operations' `define-operating-context` first. Active priorities anchor whether decision load-bearing.

2. **Resolve subject.** From chat, extract decision topic and propose kebab-case slug (e.g. `switch-pricing-to-seat-based`). Confirm briefly if ambiguous.

3. **Read `config/decision-framework.md`.** If missing or sparse, ask ONE question: *"Who decides pricing / product strategy / hiring / structural bets? Best: drop a RACI doc or decision-rights page from a connected wiki. Otherwise paste a sentence  -  I'll expand as more decisions land."* Write and continue.

4. **Decide `status`.** Based on framework:
   - CEO decider and not yet decided → `pending`.
   - Owner-scoped and owner declared → `decided` with `decidedBy` and `decidedAt`.
   - User is CEO and declared → `decided`.

5. **Check duplicates.** Scan `decisions.json` for existing slug or near-duplicate title. If exists, update in place (append alternatives to `considered`, refine `rationale`, move `pending` → `decided` with `decidedAt`) rather than new row.

6. **Write ADR** at `decisions/{slug}/decision.md` (atomic):

   ```markdown
   # Decision: {title}

   - **Status:** {pending | decided | superseded}
   - **Decided by:** {who, if decided}
   - **Decided at:** {ISO-8601, if decided}
   - **Linked initiatives:** {slugs}

   ## Context
   {1-2 paragraphs  -  what prompted this, what's at stake}

   ## Alternatives considered
   1. **{Option A}**  -  {short description}. Trade-offs: {...}.
   2. **{Option B}**  -  {short description}. Trade-offs: {...}.
   3. **{Option C / status quo if relevant}**  -  {...}.

   ## Decision
   {the chosen path, 1 paragraph}

   ## Rationale
   {why this one over the alternatives  -  short, honest}

   ## Consequences
   - **Good:** {what becomes easier}
   - **Hard:** {what becomes harder}
   - **Unknowns:** {what we'll learn over time}

   ## Open questions
   {anything still TBD}
   ```

7. **Upsert in `decisions.json`** with `{ slug, title, summary, status, decidedBy?, decidedAt?, linkedInitiativeSlugs, considered, rationale? }`. Keep `summary` one line  -  shows in dashboard.

8. **Sensitive matters.** If decision touches performance, compensation, exits, or legal, DO NOT land specifics in indexed `summary`. Generalize ("Exec transition on {domain}" rather than named), keep full narrative only in per-decision markdown file, flag privately to founder in chat.

9. **Append to `outputs.json`** with `type: "decision"`, status "ready" (decision is artifact of record).

10. **Summarize in chat.** One sentence: what logged, status, where lives.

## Outputs

- `decisions/{slug}/decision.md` (new or overwritten)
- Upserted `decisions.json`
- Possibly updated `config/decision-framework.md` (progressive capture)
- Appends to `outputs.json` with `type: "decision"`.

## What I never do

- **Decide for you**  -  `log-decision` captures; CEO decides.
- **Land sensitive specifics** in shared indexed rows.
- **Overwrite superseded decision** silently  -  mark old `status: "superseded"` and link new one.
- **Invent alternatives**  -  if user only told chosen path, ask one question for 1-2 realistic alternatives on table.