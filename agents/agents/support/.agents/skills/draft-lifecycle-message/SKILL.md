---
name: draft-lifecycle-message
description: "Use when you say 'welcome series for new signups' / 'draft 30/60/90 renewal outreach' / 'expansion nudge for {account}' / 'save {account}' — I draft the `type` you pick: `welcome-series` day 0/1/3/7/14 · `renewal` day-90/60/30 sequence · `expansion-nudge` one outreach grounded in a ceiling signal · `churn-save` one save grounded in the risk signal. Writes to `onboarding/` · `renewals/` · `expansions/` · `saves/`. No guilt, no fake scarcity."
integrations:
  esp: [customerio, loops, mailchimp, kit]
  crm: [hubspot, attio]
  billing: [stripe]
---

# Draft Lifecycle Message

One skill, every customer-lifecycle outreach your success motion need. Branches on `type`.

## When to use

- **welcome-series** — "draft onboarding for {segment}" / "welcome series for new signups" / "activation drip."
- **renewal** — "renewal coming for {account}" / "draft 30/60/90 for {account}" / "pre-renewal outreach."
- **expansion-nudge** — "they ready for {tier}" / "draft expansion nudge for {account}" / "ceiling signal for {account}."
- **churn-save** — "save {account}" / "draft save for {customer}" / "they asked to cancel."

## Ledger fields I read

- `universal.positioning` — read `context/support-context.md` for product surface, voice, pricing stance.
- `universal.voice` — tone cues every draft.
- `universal.icp.planTiers` — know what "upgrade" / "downgrade" mean for account.
- `domains.success.planTiers`, `renewalCadence`, `churnSignals` — operating map for domain.

Required field missing → ask ONE targeted question with modality hint, write it, continue.

## Parameter: `type`

- `welcome-series` — 5-touch sequence day 0 / 1 / 3 / 7 / 14 for new signups in `{segment}`. Each touch: subject, preview, body, CTA, success metric. Writes `onboarding/{segment}.md`.
- `renewal` — 3-touch pre-renewal sequence (Day-90 / Day-60 / Day-30) for `{account}`, grounded in account timeline. Each touch: subject, body, CTA, specific win to reference. Writes `renewals/{account}-{YYYY-MM-DD}.md`.
- `expansion-nudge` — ONE outreach for `{account}` grounded in specific ceiling signal (feature-adoption threshold, team-size change, repeated ask). Writes `expansions/{account}.md`.
- `churn-save` — ONE save message for `{account}` grounded in exact risk signal from `churn-flags.json`, offering genuine option (pause / downgrade / concierge / refund). Writes `saves/{account}.md`.

## Steps

1. **Read `config/context-ledger.json` and `config/voice.md`.** Fill gap with one targeted question.
2. **Read `context/support-context.md`.** Missing → stop, tell me run `define-support-context` first.
3. **Branch on `type`:**
   - `welcome-series`: ask me `{segment}` if not given, draft 5 emails keyed to product's activation milestones (check `domains.email.journey` if set, else ask me name signup / activation / aha events).
     Format for connected ESP (Customer.io / Loops / Mailchimp / Kit via Composio). Include success metrics per touch.
   - `renewal`: chain `customer-view view=timeline` for account, pull wins, asks-shipped, friction. Draft Day-90 (value recap), Day-60 (expansion opportunity or renewal mechanics), Day-30 (direct ask + agenda). Every reference grounded in timeline artifact.
   - `expansion-nudge`: chain `customer-view view=health` to find ceiling signal. Draft short, specific outreach naming signal ("I noticed you added 3 seats — {tier} would lift the per-seat cap") and propose option. No upsell pressure; no real signal → stop, tell me.
   - `churn-save`: chain `customer-view view=churn-risk` to pull exact flag. Acknowledge risk honestly, name specific pain, offer pause / downgrade / concierge / refund — whichever policy in `context/support-context.md`. Never invent discount not pre-approved.
4. **Write artifact** atomic to path for this `type`.
5. **Append to `outputs.json`** with `type` = `onboarding-sequence` | `renewal-outreach` | `expansion-nudge` | `churn-save`, `domain: "success"`, title, summary, path, status `draft`.
6. **Summarize to me.** Headline: one-line hook or subject, specific signal grounding it, recommended send window.

## Outputs

- `onboarding/{segment}.md` (for `type = welcome-series`)
- `renewals/{account}-{YYYY-MM-DD}.md` (for `type = renewal`)
- `expansions/{account}.md` (for `type = expansion-nudge`)
- `saves/{account}.md` (for `type = churn-save`)
- Appends `outputs.json` with `domain: "success"`.

## What I never do

- Send. Every lifecycle message draft you review.
- Use guilt, fake scarcity, dark patterns (especially `churn-save` and `renewal`).
- Invent discount, credit, exception not in `context/support-context.md`.
- Draft `expansion-nudge` without real ceiling signal — data thin → stop, tell me.