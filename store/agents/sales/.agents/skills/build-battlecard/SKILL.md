---
name: build-battlecard
description: "Use when you say 'they're looking at {competitor}' / 'build a battlecard for {Acme} vs {competitor}'  -  I research the competitor via Firecrawl + Exa (positioning, pricing, weaknesses, recent reviews) and produce a per-prospect card: 3-criterion grid anchored in what this prospect cares about, 3 trap-set questions, 3 rebuttals, 2 proof points. Writes to `battlecards/{competitor-slug}-{prospect-slug}.md`."
version: 1
tags: [sales, build, battlecard]
category: Sales
featured: yes
image: handshake
integrations: [notion, reddit, firecrawl]
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Build Battlecard

NOT generic comparison sheet. Per-prospect card anchored in what THAT prospect cares about.

## When to use

- User: "they're evaluating us against {competitor}" / "build me battlecard for Acme deal vs {competitor}" / "how do I beat {competitor} for this one".
- Called inline by `draft-outreach` or `analyze subject=discovery-call` when competitor named in transcript.

## Steps

1. **Identify prospect + competitor.** Load lead row in `leads.json` and `calls/{slug}/notes-*.md` if call exists  -  prospect's specific evaluation criteria and stated pains = anchor.
2. **Read our product + positioning.** `context/sales-context.md` for what we claim  -  especially "Top 3 competitors" and "Category & differentiators" sections. If thin, ask once: "What's your honest top-3 differentiator vs {competitor}? And biggest weakness? (Roll into playbook  -  paste, or point at Notion / Google Doc URL.)"
3. **Research competitor.** Run `composio search` for available research tools. Pull:
   - Marketing-page positioning (one-line pitch, top 3 claims)
   - Public pricing shape (tiers, model)
   - Recent reviews last 6 months (G2 / Capterra / Reddit / forum threads  -  via any connected web-search tool)
   - Known weaknesses (complaints about {X}, performance gripes, missing features)
   Capture sources + dates.
4. **Research prospect's use case.** From dossier and call notes, summarize in 2 lines: what they need tool to do, and top 3 criteria.
5. **Build comparison grid**  -  for THEIR top 3 criteria only (not 30-row feature matrix). Each: us vs them, honest verdict (WE-WIN / THEY-WIN / TIE), one-sentence why.
6. **Trap-set questions.** 3 questions user asks next call to surface competitor weaknesses naturally  -  not gotchas, genuine discovery. Each tied to known competitor pain.
7. **Objection rebuttals.** Anticipate 3 objections competitor's rep raises about us; draft 2-sentence rebuttal each, anchored in our differentiators (no false claims).
8. **Proof points to cite.** 2-3 customer stories from playbook's anchor accounts section matching prospect profile. If anchor accounts thin, ask once for Notion / Google Doc URL listing top-cited wins; fold into playbook on next `define-playbook` run.
9. **Write** to `battlecards/{competitor-slug}-{prospect-slug}.md` with: prospect + competitor header, criteria grid, trap-set questions, objection rebuttals, proof points, research-sources footer.
10. **Append to `outputs.json`**  -  read-merge-write atomically: `{ id (uuid v4), type: "battlecard", title: "{Prospect} vs {Competitor}", summary, path, status: "draft", createdAt, updatedAt, domain: "meetings" }`.
11. **Hand off to user:** "Battlecard ready  -  3-criterion grid, 3 trap-set questions, 3 rebuttals, 2 proof points. Want me to weave into follow-up draft with `draft-outreach stage=followup`?"

## Honesty rule

Never fabricate "they're weak at {X}" without cited source. If claim has no source, mark "(hypothesis  -  verify)" so user doesn't repeat as fact. Fabricated battlecards blow up in demos.

## Outputs

- `battlecards/{competitor-slug}-{prospect-slug}.md`
- Appends to `outputs.json` with `type: "battlecard"`, `domain: "meetings"`.