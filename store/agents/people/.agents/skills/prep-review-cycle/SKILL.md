---
name: prep-review-cycle
description: "Use when you say 'prep the review cycle' / 'Q{N} reviews are starting' / 'build the review templates'  -  produces the self-review template, manager-review template, calibration doc, and full timeline, all scoped to the leveling framework in `context/people-context.md`. Writes to `review-cycles/{cycle-slug}.md` as `status: \"draft\"` until you approve the structure."
version: 1
tags: [people, prep, review]
category: People
featured: yes
image: busts-in-silhouette
integrations: [googledocs, notion]
---


# Prep Review Cycle

## When to use

- Explicit: "prep the review cycle", "Q{N} reviews are starting",
  "build the review templates", "set up the next review cycle".
- Implicit: triggered by `weekly-people-review` when upcoming
  cycle date from `context/people-context.md` within lead-time window.
- Frequency: one per cycle. Founder want refresh mid-cycle?
  re-run, supersede.

## Steps

1. **Read people-context doc:**
   `context/people-context.md`. Missing or empty? tell
   user run `define-people-context` first, stop. Read
   **leveling framework**, **comp bands** (for calibration
   sanity-check), **review-cycle rhythm**, **voice notes**.
2. **Read config:** `config/context-ledger.json`. Review-cycle rhythm unset? use
   one in `context/people-context.md`. Roster source
   `connected-hris`? pull current team via `composio search hris`.
3. **Resolve cycle slug.** Default `YYYY-q{N}` (e.g.
   `2026-q2`) for quarterly, `YYYY-h{N}` for semi-annual, `YYYY`
   for annual. Ask user if default mismatch
   internal naming.
4. **Produce four artifacts** in one markdown file:

   - **Self-review template**  -  prompt blocks scoped to leveling
     framework. One section per level attribute (scope, autonomy,
     craft, collaboration, impact) with 1-2 open prompts each. Keep
     prompts short  -  founders' early team won't write 1500-word
     self-reviews, don't want them to.

   - **Manager-review template**  -  same attribute scaffolding,
     plus overall-rating rubric drawn from cycle's rating
     scale (if `context/people-context.md` defines one) and
     promotion-readiness flag per person. Include section for
     "specific examples observed this cycle"  -  evidence-first, not
     vibes.

   - **Calibration doc**  -  cross-team view for:
     - Leveling consistency (L3 ICs reviewed against
       same bar across teams?).
     - Comp-bump sanity check (comp bands exist? flag any
       proposed comp change crossing band edges).
     - Promotion candidates surface (who flagged
       promotion-ready; cross-check tenure-at-level from
       `context/people-context.md` if defined).

   - **Timeline**  -  dated milestones from today to delivery:
     self-reviews due → manager-reviews due → calibration meeting →
     comp letters finalized → delivery 1:1s held. Derive concrete
     dates from cycle's start/end window; mark any needing
     founder input.

5. **Voice check.** Pull voice notes from `context/people-context.md`  -
   template prompts and calibration doc should sound like
   founder's HR voice, not generic HR-ese.

6. **Write** to `review-cycles/{cycle-slug}.md` atomically
   (`*.tmp` → rename). Structure: Cycle overview → Timeline →
   Self-review template → Manager-review template → Calibration doc.

7. **Append to `outputs.json`**  -  read existing array, add
   `{ id, type: "review-cycle", title, summary, path, status: "draft",
   createdAt, updatedAt }`, write atomically. Status stays `draft`
   until founder approves cycle structure  -  flip to `ready`
   on sign-off.

8. **Summarize to user**  -  one paragraph covering cycle slug,
   timeline highlights, path to package. Close with: "These
   are drafts. Review the templates and the timeline, then tell me
   to mark ready and I'll flip status  -  nothing goes to the team
   until you sign off."

## Never invent

Don't invent leveling framework or rating scale founder
hasn't written. If `context/people-context.md`'s leveling section `TBD`,
tell user: "I can draft generic prompts, but templates land
much better once `draft-leveling-framework` is run." Proceed with
clearly-marked generic template only if user explicitly asks.

## Outputs

- `review-cycles/{cycle-slug}.md`
- Appends to `outputs.json` with type `review-cycle`.