---
name: draft-performance-doc
description: "Use when you say 'draft a PIP for {employee}' / 'someone flagged RED — what do I say' / '{employee} might be leaving' — I draft the `type` you pick: `pip` runs a MANDATORY escalation check (protected class + pretextual timing) BEFORE drafting a Context → Expectations → 30/60/90 Milestones → Support → Consequences plan · `stay-conversation` drafts a verbal 1:1 SCRIPT (Open → Listen → Surface → Ask → Propose) filtered against your hard nos. Writes to `performance-docs/{type}-{employee-slug}.md`. Never delivered without your sign-off."
integrations:
  messaging: [slack]
  inbox: [gmail]
---

# Draft Performance Doc

Two most tone-sensitive artifacts agent produce. Both read voice + hard-no constraints from `context/people-context.md` before draft. Both end as files at agent root — you deliver, never me.

## When to use

- `type=pip` — "draft a PIP for {employee}", "performance improvement plan for {employee}", "{manager} flagged {employee} for performance concerns".
- `type=stay-conversation` — "draft a stay conversation for {employee}", "{employee} might be leaving", "someone flagged RED — what do I say", "retention conversation prep".

`stay-conversation` also recommended by `analyze subject=retention-risk` for every RED. `pip` always triggered by you — never implicitly.

## Ledger fields I read

- `universal.voice` — voice notes drive draft tone. PIP or stay script in wrong voice land harder/softer than intended.
- `domains.people.roster` — resolve employee slug. If employee not on roster, ask confirm name + role.

If required field missing, ask ONE targeted question with modality hint (Composio connection > file drop > URL > paste), write, continue.

## Parameter: `type`

- `pip` — performance improvement plan. Run escalation check first, no exceptions. If protected-class + pretextual-timing trigger fire, STOP, write escalation note routing to human lawyer. If clear, draft Context → Expectations → 30/60/90 Milestones → Support → Consequences plan. Write to `performance-docs/pip-{employee-slug}.md`.
- `stay-conversation` — verbal 1:1 SCRIPT, not email. Five sections: Open → Listen → Surface → Ask → Propose. Filtered against hard nos (e.g. counter-offer policy). Write to `performance-docs/stay-conversation-{employee-slug}.md`.

## Steps

1. **Read ledger** + fill gaps with ONE targeted question.
2. **Read `context/people-context.md`.** If missing/empty, tell you: "I need the people context first — run the define-people-context skill." Stop.
3. **Read optional `employee-dossiers/{employee-slug}.md`** if exists. Pull tenure, role history, recent performance notes, prior manager feedback. If missing, note gap + work from `checkins/` + your stated concerns.
4. **Read recent check-ins.** Last 4-6 `checkins/{YYYY-MM-DD}.md` files — pull every response from this employee (blockers, frustrations, themes).
5. **Branch on `type`:**

   - **If `type = pip` — run escalation check first:**
     1. Read escalation-rules section of `context/people-context.md`. Note every trigger listed. Canonical set: protected class (race, gender, age 40+, pregnancy, disability, religion, national origin, sexual orientation, veteran status — confirm jurisdiction's list in context doc); protected activity within trigger window (medical-leave request, pregnancy disclosure, accommodation request, whistleblower / good-faith complaint, union activity, workers' comp claim); timing trigger (concerns arising or escalating within 30-90 days of protected activity — window defined in doc).
     2. Assess: ask you directly (or read dossier if present) for employee's protected-class status, recent protected activity, timeline of when concerns first documented vs. when activity occurred. Do NOT guess — if unknown, ask + explain: "I need this to run the escalation check — nothing is drafted until it clears."
     3. If ANY trigger match: STOP. Do NOT draft PIP. Write **escalation note** (not PIP) to `performance-docs/pip-{employee-slug}.md`: "This case needs a human lawyer before any PIP is written because: {specific trigger}. The match: {class/activity} + {timing}." Add short paragraph on why (retaliation claims hinge on pretextual timing; fair PIP in this window still create risk). Append to `outputs.json` with `type: "performance-doc"`, `escalation: "needs-lawyer"`. Summarize: "Escalation triggered — stopped. Do not draft or deliver a PIP until a lawyer has reviewed. Specific trigger: {trigger}." Stop.
     4. If clear, read leveling + voice notes from context doc + draft PIP with structure:
        - **Context** — what specifically underperforming, with concrete examples dated + sourced. Evidence-first. Never invent — if example can't sourced, leave out.
        - **Expectations** — what "meeting the bar" look like at this level, pulled from leveling framework. Each expectation observable + measurable.
        - **Milestones** — 30 / 60 / 90-day checkpoints. Each name measurable criteria employee must demonstrate by that date. Tied to expectations, not vibes.
        - **Support** — what you + manager provide: weekly 1:1s, feedback cadence, training budget, pairing with senior, clearer project scope. PIP without real support = paper.
        - **Consequences** — what happens if milestones not met at 30 / 60 / 90. Plainly stated in your voice — neither softened nor threatening.

   - **If `type = stay-conversation`:**
     1. Read retention-score reasoning. If `analyses/retention-risk-{...}.md` flagged this employee RED, read reasoning block. Script surface themes signals revealed — never signals literally (employees don't need hear "your commit cadence dropped"; need hear "I've sensed something is off").
     2. Draft script in five sections:
        - **Open** — warm, specific, your voice. One/two sentences that land purpose without ambushing.
        - **Listen** — 3-4 open-ended questions designed get them talking first. What going well. What frustrating. What they'd change.
        - **Surface** — what you noticed, framed as observation not accusation. Draw from check-in themes + dossier history. Never cite engagement signals literally.
        - **Ask** — direct question: "What would make you want to stay here for another year?" (or equivalent in your voice). One clear ask.
        - **Propose** — concrete levers: scope change, title change, project move, manager change, comp review. Filter every lever against hard nos in `context/people-context.md` — if "we never counter-offer on resignations" written, comp off table; redirect to scope / title / project.
     3. Header at top of file: "**This is a script for a verbal 1:1, not an email. Do not send.**"

6. **Write atomically** to per-type path (`*.tmp` → rename).
7. **Append to `outputs.json`** with:
   ```json
   {
     "id": "<uuid v4>",
     "type": "performance-doc",
     "title": "<type> — <employee>",
     "summary": "<2-3 sentences>",
     "path": "performance-docs/<type>-<employee-slug>.md",
     "status": "draft",
     "escalation": "drafted | blocked-on-escalation | needs-lawyer | n/a",
     "createdAt": "<ISO>",
     "updatedAt": "<ISO>",
     "domain": "performance"
   }
   ```
   `escalation` = `n/a` for stay-conversations.
8. **Summarize.** One paragraph covering key elements + path.
   - For `pip`: include Context summary, 30/60/90 at glance, escalation classification. Close: "This is a draft. PIPs are never delivered without your sign-off and, ideally, a second set of eyes. Read, tell me what to change, flip status to `ready` after sign-off."
   - For `stay-conversation`: "This is a prompt for a verbal 1:1 — don't send it. Read before your next 1:1 and adapt in the moment."

## Outputs

- `performance-docs/pip-{employee-slug}.md` (`type=pip`).
- `performance-docs/stay-conversation-{employee-slug}.md` (`type=stay-conversation`).
- Append to `outputs.json` with `type: "performance-doc"`, `domain: "performance"`.

## What I never do

- Draft PIP without run escalation check first. No exceptions.
- Write stay conversation as email. Verbal by design. If you ask for email version, decline + explain why.
- Recommend counter-offer unless `context/people-context.md` explicitly allow.
- Invent examples, dates, quotes for PIP Context section. Invented evidence destroy both legal + human legitimacy.
- Flip any `performance-doc` to `ready` automatically — you sign off.