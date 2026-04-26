---
name: write-adr
description: "Use when you say 'write an ADR for {decision}' / 'record this decision' / 'ADR for {choice}'  -  produce Michael Nygard-style Architecture Decision Record with Title, Status, Context, Decision, Consequences. Future-you (or new hire) understand WHY decision made, not just what. Write to `adrs/{YYYY-MM-DD}-{slug}.md`."
version: 1
tags: [engineering, write, adr]
category: Engineering
featured: yes
image: laptop
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Write ADR

## When to use

- Explicit: "write an ADR for {decision}", "record this decision as an ADR", "ADR for {X}", "capture why we chose {X} over {Y}".
- Implicit: user just made meaningful architectural choice (DB, framework, boundary, protocol, data-flow) in conversation and decision worth preserving.
- One ADR per decision. New info? Write new ADR that supersedes old  -  no edit in place.

## Steps

1. **Read engineering context**: `context/engineering-context.md`. If missing, tell user run `define-engineering-context` first and stop. Current stack part of ADR Context section.
2. **Read config**: `config/stack.json` if present. Useful if decision stack-local.
3. **If decision ambiguous, ask ONE question**  -  what alternatives were and why this one won. Best modality: paste, or point at design-doc that led to decision.
4. **Optional web-search** via `composio search web-search` if decision references prior art / canonical sources worth citing in Context.
5. **Draft ADR** to `adrs/{YYYY-MM-DD}-{slug}.md` atomically (`*.tmp` → rename). Michael Nygard template:
   - **Title**  -  `ADR-{nnn}: {decision in one line}`. Use next sequential number by scanning existing files in `adrs/` (start at `001` if empty).
   - **Status**  -  one of `Proposed` / `Accepted` / `Deprecated` / `Superseded by ADR-{nnn}`. Default `Accepted` if user says decision made, `Proposed` otherwise.
   - **Context**  -  1-3 paragraphs. Why decision made now, what forces at play (technical, organizational, product). Ground in engineering context doc.
   - **Decision**  -  change chosen. Active voice, clear. ("We will use Postgres for the orders service.")
   - **Consequences**  -  positive, negative, neutral. What easier, what harder, what trade-offs signing up for. Honest about downsides  -  point of ADR is future-them can audit reasoning.
   One page target. Padding defeats purpose.
6. **If ADR supersedes earlier one**, update earlier ADR Status line to `Superseded by ADR-{nnn}` (atomic write) and note in new ADR Context.
7. **Append to `outputs.json`**  -  `{ id, type: "adr", title, summary, path, status: "ready" (if Accepted) or "draft" (if Proposed), createdAt, updatedAt }`, atomic write.
8. **Summarize to user**  -  one paragraph with decision, key consequence, path to ADR.

## Never invent

Decision section must match what user actually chose. If inferring  -  say "I inferred X from our conversation; is that right?" before writing. No fabricate trade-offs.

## Outputs

- `adrs/{YYYY-MM-DD}-{slug}.md`
- Updates earlier ADR Status line if superseded.
- Appends to `outputs.json` with type `adr`.