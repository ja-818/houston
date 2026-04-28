---
name: define-support-context
description: "Use when you say 'set up our support context' / 'update the support doc'  -  I interview you and write `context/support-context.md` (product surface, voice, SLA tiers, VIP list, routing rules, known gotchas). Every other skill reads this doc first  -  it's the source of truth for tone, escalation, and routing."
version: 1
tags: [support, define, support]
category: Support
featured: yes
image: headphone
integrations: [googledocs, stripe, notion, github, linear]
---


# Define Support Context

Own `context/support-context.md`. Only skill that creates or updates full doc (routing section also editable by `tune-routing-rules`). Every other skill read it before work  -  until exists, stop and ask you run me first.

## When to use

- "set up our support context" / "define our support context" / "let's do the context doc".
- "update the context doc" / "a new tier / VIP / gotcha  -  fix the context".
- Called implicitly by any other skill needing context and finds doc missing  -  but only after confirming with you.

## Steps

1. **Read `config/context-ledger.json`.** Need `universal.company`, `universal.icp`, `domains.inbox.slaTargets`, `domains.inbox.routingCategories`, `domains.quality.escalationTiers`. Any missing field, ask ONE targeted question with modality hint (connected app > file > URL > paste), write atomic, continue.

2. **Read existing doc if present.** If `context/support-context.md` exists, read so run is update not rewrite. Preserve anything sharpened; change only stale or new.

3. **Push for verbatim language.** Before drafting, ask you for 2–3 verbatim customer phrases or example tickets  -  friction words, repeat gotchas. If `voice-samples/` has entries, mine first.

4. **Draft doc (~400–700 words, opinionated, direct).** Structure, this order:

   1. **Product overview**  -  one paragraph: what product is, who for, key surface areas (features/flows), pricing model, self-serve vs gated.
   2. **Customer segments + VIP list**  -  named segments + VIP accounts. VIPs get P1 regardless of content.
   3. **Tone + voice**  -  default tone (direct / warm / human), 3–5 verbatim samples from `voice-samples/` if present (else `TBD  -  run voice-calibration`), forbidden phrases.
   4. **SLA tiers**  -  P1 / P2 / P3 / P4 definitions + response-time expectations per tier. Name what qualifies as each tier.
   5. **Routing rules**  -  decision tree:
      - Bug → tracker target (Linear / GitHub  -  from config or ask); capture info (repro, version, customer).
      - Feature request → `requests.json`, with customer attribution.
      - Outage → playbook reference (`playbooks/p1-outage.md` once drafted).
      - Billing → Stripe dossier + refund approver (founder by default).
   6. **Known gotchas**  -  short whisper-list of product quirks answered 10+ times. 3–10 bullets.

5. **Mark gaps honestly.** If section thin, write `TBD  -  {what you should bring next}`. Never invent.

6. **Write atomically.** Write to `context/support-context.md.tmp`, rename to `context/support-context.md`. Single file under `context/`  -  NOT under `.agents/` or `.houston/` (watcher skips).

7. **Append to `outputs.json`.** Read existing array, append new entry (`type: "support-context"`, `domain: "quality"`, title summarizing change), write atomic.

8. **Summarize to me.** One paragraph: what wrote, what still `TBD`, next move ("next: run `voice-calibration`" / "next: tell me which tracker you use for bugs"). Remind me every other skill now operate against doc.

## Outputs

- `context/support-context.md` (at agent root  -  live document)
- Appends to `outputs.json` with `type: "context-edit"`.