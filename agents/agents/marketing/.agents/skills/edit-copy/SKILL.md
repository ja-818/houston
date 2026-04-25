---
name: edit-copy
description: "Use when you say 'edit this' / 'tighten' / 'polish my about page' / 'this reads awkward' — I tighten existing copy in your voice: cut adjectives, remove marketer-speak, add specificity, fix rhythm. Preserves intent. Writes an edited version to `copy-edits/{slug}.md` with before/after notes."
---

# Edit Copy

Enhance existing copy — no rewrite. Core message stay; lines tighter, clearer, still sound like founder.

## When to use

- "Edit the copy on my {page}"
- "Tighten this — too wordy"
- "Polish my about page"
- "Proofread and sharpen this"
- Called after `write-page-copy` to polish final draft in one focused pass.

## Steps

1. **Read positioning doc** at `context/marketing-context.md`. If missing, tell user run Head of Marketing's `define-positioning` first and stop.
2. **Read `config/voice.md`.** If missing, ask ONE targeted question naming best modality (connected inbox via Composio > file > paste 2-3 samples) and write file before continuing. Voice load-bearing for edits — without it smooth user into chatbot-speak.
3. **Collect source copy.** User pasted → work from paste. User gave URL → fetch via any Composio-connected scraper (discover slug with `composio search`, execute by slug). Nothing provided → ask for copy or URL and stop.
4. **Run sweeps** in order. Each sweep focused — no multiplex. After each, loop back, check prior sweeps not compromised.
   - **Clarity** — confusing sentences, unclear pronouns, jargon, ambiguity, missing context, sentences doing too much.
   - **Voice** — consistency with `config/voice.md`. Flag lines where voice breaks (started casual, went corporate; shifted person; etc.).
   - **Specificity** — swap vague claims with concrete. "Saves time" → "Cuts weekly reporting from 4 hours to 15 minutes." Numbers over adjectives. No numbers from user → mark `[NEEDS NUMBER]` inline; no invent.
   - **Length** — kill filler. "In order to" → "to". "At this point in time" → "now". Drop exclamation points.
   - **CTAs** — swap weak CTAs ("Submit" / "Click Here" / "Learn More") with action + outcome ("Start my free trial" / "See pricing for my team"). Change load-bearing → hand to `write-cta-variants`.
5. **Output format.** Each line changed → three rows:
   - **Current** (verbatim).
   - **Proposed**.
   - **Why** — one line. Name sweep that caught it (clarity / voice / specificity / length / CTA).
6. **Preserve core message.** Rewrite of idea needed → flag it, no overwrite. Hand that section to `write-page-copy` instead.
7. **Flag contradictions** with positioning doc in separate section.
8. **Write** atomic to `copy-edits/{page-slug}-{YYYY-MM-DD}.md` (`*.tmp` → rename).
9. **Append to `outputs.json`** — `{ id, type: "copy-edit", title, summary, path, status: "draft", createdAt, updatedAt }`.
10. **Summarize to user** — count of lines changed, single highest-leverage edit, path to pass.

## Never

- Rewrite core message — that `write-page-copy` job.
- Smooth user voice into generic marketing-speak.
- Invent stats or testimonials to "strengthen" line.

## Outputs

- `copy-edits/{page-slug}-{YYYY-MM-DD}.md`
- Append to `outputs.json` with `type: "copy-edit"`.