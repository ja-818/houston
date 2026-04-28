---
name: tune-routing-rules
description: "Use when you say 'update our routing' / 'what counts as a bug' / 'change where feature requests go'  -  I rewrite the routing section of `context/support-context.md` with concrete bug / feature / how-to / billing / churn examples so `triage-incoming` and `detect-signal` route correctly."
version: 1
tags: [support, tune, routing]
category: Support
featured: yes
image: headphone
integrations: [googledocs, stripe, notion, github, linear]
---


# Tune Routing Rules

## When to use

- "update our routing" / "fix routing" / "what's bug vs feature request."
- "we moved to {tracker}" / "refunds now go to {person}" / "add new tier."
- When `review scope=weekly` surface classification drift.

## Ledger fields I read

- `domains.inbox.routingCategories`  -  current category list.

## Steps

1. **Read `context/support-context.md`.** If missing, run `define-support-context` first.

2. **Surface current rules to me.** Read Routing rules section, restate in 3–4 lines ("today: bug → Linear, feature request → `requests.json`, outage → `playbooks/p1-outage.md`, billing → Stripe + you approve refunds"). Ask: what changing?

3. **Capture update.** Ask ONE focused question at time  -  no whole interview. Typical updates:
   - New tracker target (moved from Linear to GitHub Issues, etc.).
   - New classification (e.g. add "security report").
   - New escalation contact.
   - Changed refund approver.
   - VIP list additions (also belong in segments section  -  update both if needed).

4. **Rewrite Routing rules section clean.** Preserve decision-tree shape. For each type, state:
   - Trigger phrases / patterns that qualify.
   - Target location (tracker slug, playbook path, dossier, chat).
   - Which skill acts (`triage-incoming`, `detect-signal`, `draft-escalation-playbook`, etc.).
   - What data to capture.

5. **Also update related sections** if change implies  -  VIP list (segments section), SLA tiers, known-gotchas entries referencing changed tracker. Be explicit what else touched.

6. **Write atomically** (`.tmp` → rename).

7. **Append to `outputs.json`** with `type: "routing-rules"`, `domain: "quality"`, title "Routing rules updated  -  {short reason}", summary 2 sentences on what changed, path `context/support-context.md`, status `draft`.

8. **Tell me effect.** End summary with: "Every `triage-incoming` and `detect-signal` run after this reads new rules  -  no manual re-sync."

## Outputs

- `context/support-context.md` (routing + possibly related sections updated)
- Appends to `outputs.json` with `type: "routing-rules"`, `domain: "quality"`.