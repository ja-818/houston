---
name: draft-design-doc
description: "Use when you say 'draft a design doc for {feature}' / 'write an RFC for {feature}' / 'design this before I build it' — I produce a full design doc with Context, Goals, Non-goals, Proposed design, Alternatives considered, Risks, and Open questions, grounded in the engineering context. Names at least two real alternatives, not strawmen. Writes to `design-docs/{feature-slug}.md`."
integrations:
  dev: [github]
  search: [exa, perplexityai]
---

# Draft Design Doc

## When to use

- Explicit: "draft a design doc for {feature}", "write an RFC",
  "design {feature} before I build it", "what's the design for
  {feature}".
- Implicit: user describe non-trivial feature about to build,
  ask for shape / approach.
- One doc per feature; re-run to iterate v2.

## Steps

1. **Read engineering context**:
   `context/engineering-context.md`. If missing or
   empty, tell user: "I need engineering context doc before
   I can design anything well. Go chat with this agent's own `define-engineering-context`
   and run `define-engineering-context` first." Stop. Stack,
   invariants, current priorities shape whole doc.
2. **Read config**: `config/stack.json` and
   `config/sensitive-areas.md`. Cross-reference feature against
   sensitive areas, call out in Risks section.
3. **If feature brief one-liner, ask ONE clarifying
   question** — user-facing problem solved, or scope boundary.
   Best modality: connected issue-tracker (run
   `composio search issue-tracker` at runtime), paste, or URL to
   linked issue. Continue.
4. **Optional research** via `composio search web-search` for prior
   art if problem novel to stack — cite sources used
   in Alternatives section.
5. **Draft doc** to `design-docs/{feature-slug}.md` atomically
   (`*.tmp` → rename). Sections, in order:
   - **Context** — why designed now. One paragraph.
     Link originating issue or conversation if known.
   - **Goals** — what feature must do. Bulleted.
   - **Non-goals** — what feature explicitly will NOT do.
     Non-goals as load-bearing as goals.
   - **Proposed design** — recommended approach. Data model,
     API surface, key flows, integration points, failure modes.
     Include simple ASCII or mermaid-style sketch if shape
     matters.
   - **Alternatives considered** — at least 2 real alternatives
     with one-line reason each rejected. Strawman
     alternatives don't count.
   - **Risks** — what could go wrong. Flag sensitive-area overlaps
     explicitly.
   - **Open questions** — what doc doesn't resolve yet.
6. **Append to `outputs.json`** — `{ id, type: "design-doc", title,
   summary, path: "design-docs/{feature-slug}.md", status: "draft",
   createdAt, updatedAt }`, atomic write.
7. **Summarize to user** — chosen approach, top rejected
   alternative, biggest risk, path to doc. Ask for
   sign-off to flip status to `ready`.

## Never invent

If stack doesn't support something user asked for, say so
and propose closest alternative — don't assume library exists.
Mark any assumption made so user can correct it.

## Outputs

- `design-docs/{feature-slug}.md`
- Appends to `outputs.json` with type `design-doc`.