---
name: define-people-context
description: "Use when you say 'draft our people-context doc' / 'set up our people context' / 'build the leveling ladder' / 'what's an L3 vs L4'  -  I draft or update the full shared doc at `context/people-context.md`: company values, team shape, leveling (IC + manager, L1-L5), comp bands, review-cycle rhythm, policy canon, escalation rules, voice, hard nos. Every other skill reads it first."
version: 1
tags: [people, define, people]
category: People
featured: yes
image: busts-in-silhouette
integrations: [googlesheets, googledocs, notion]
---


# Define People Context

One doc every skill in agent reads before producing substantive output  -
offer, PIP, policy answer, retention score, review cycle. Owned at
`context/people-context.md`. I draft, you decide. Never set comp bands or
lock leveling without sign-off.

## When to use

- "draft our people-context doc" / "set up our people context" /
  "document how we do HR".
- "update the people-context doc" / "our leveling changed, fix the
  context doc".
- "draft our leveling framework" / "build the leveling ladder" /
  "what's an L3 vs L4".
- Called implicitly by any skill needing doc when missing  -  only after
  confirming with you.

## Ledger fields I read

- `universal.company`  -  name, website, stage (shapes opinionation:
  pre-first-hire gets more scaffolding, 15+ gets tighter).
- `universal.voice`  -  tone summary, used for voice-notes section.
- `domains.people.hris`  -  connected HRIS = pull team shape directly.
- `domains.people.handbookSource`  -  optional source doc (Notion /
  Google Docs / Google Sheets) to import from.
- `domains.people.levels`  -  leveling draft exists + location.

Missing required field: ask ONE targeted question with modality hint
(Composio connection > file drop > URL > paste), write, continue.

## Steps

1. **Read `config/context-ledger.json`.** Fill gaps with single targeted
   question.
2. **Read existing doc if present.** If `context/people-context.md`
   exists, read so run = update, not rewrite. Preserve sharpened parts;
   change only stale or new.
3. **Optional import.** Ask once: "Got an existing handbook, policy
   doc, or comp sheet I should pull from? I can read Notion, Google
   Docs, or Google Sheets if you've connected one." If yes, run
   `composio search docs` / `composio search sheets`, fetch, cite
   source per section.
4. **Push hard on escalation rules  -  cannot be inferred.** Ask
   directly: "Who do discrimination / harassment / wage-dispute /
   visa issues route to? A named human lawyer, or should we mark
   TBD?" No defaults. No lawyer yet → section reads `TBD  -  needs
   employment lawyer on retainer before first hire` and I tell you
   explicitly.
5. **Draft doc (~500-900 words, opinionated).** Sections, in order:
   1. **Company values**  -  4-6 values, 1-line definitions. From your
      words; no HR-poster clichés.
   2. **Team shape**  -  headcount by function, open reqs. Pull from
      connected HRIS if available, else paste.
   3. **Leveling framework**  -  IC + manager tracks with level names,
      summary expectations, scope of impact, seniority markers per
      level. Default L1-L5; ask once if you want higher. Each level
      has: name (e.g. "Senior Engineer"), one-paragraph expectations,
      scope (team / function / org / cross-org), seniority markers
      (rough years band, decision rights, ambiguity tolerance), and
      "Embodies {value X, value Y} at this level by…" line tying to
      values section.
   4. **Comp bands**  -  range per level, equity stance, location
      multipliers. Accept `TBD` generously  -  week 0 founders don't
      know bands yet.
   5. **Review-cycle rhythm**  -  annual / semi-annual / quarterly,
      next cycle date.
   6. **Policy canon**  -  leave, benefits, expenses, remote work,
      travel, equipment. Link source docs where exist; `TBD` where
      not.
   7. **Escalation rules**  -  agent-answered vs founder-routed vs
      lawyer-routed. Name lawyer / firm or write `TBD  -  needs
      employment lawyer on retainer`. Load-bearing for
      `answer-policy-question`, `draft-performance-doc`, and
      `run-approval-flow`.
   8. **Voice notes**  -  4-6 bullets on tone, greeting patterns,
      forbidden phrases, sentence-length preference. From ledger
      voice summary + `config/voice.md` if exists.
   9. **Hard nos**  -  what team never does (e.g. "we never
      counter-offer on resignations," "we never publish salaries,"
      "we always give 30-day notice before equity expirations").
6. **Mark gaps honestly.** Thin section → write `TBD  -  {what you
   should bring next}`. Never invent. Especially never invent comp
   bands, escalation routing, legal language.
7. **Write atomically** to `context/people-context.md.tmp`, then
   rename. One file at `context/`. NOT under `.agents/`. NOT under
   `.houston/<agent>/`.
8. **Update ledger.** Set
   `universal.positioning = { present: true, path:
   "context/people-context.md", lastUpdatedAt: <ISO> }` atomically.
9. **Append to `outputs.json`.** Entry:
   ```json
   {
     "id": "<uuid v4>",
     "type": "people-context",
     "title": "People-context doc updated",
     "summary": "<2-3 sentences  -  what changed this pass + which sections still TBD>",
     "path": "context/people-context.md",
     "status": "draft",
     "createdAt": "<ISO>",
     "updatedAt": "<ISO>",
     "domain": "culture"
   }
   ```
   (Doc = live file; each substantive edit indexed so update trail
   shows on dashboard.)
10. **Summarize.** One paragraph: what changed, which sections still
    `TBD` (especially escalation rules + comp bands), exact next move.

## Outputs

- `context/people-context.md` (live document).
- Appends to `outputs.json` with `type: "people-context"`,
  `domain: "culture"`.

## What I never do

- Set comp bands or lock leveling definitions without sign-off.
- Draft escalation rules without explicit input  -  ask or mark `TBD`.
  Section load-bearing + legal-adjacent.
- Write doc under `.agents/` or `.houston/<agent>/`  -  Houston's
  watcher skips those paths. Always `context/`.