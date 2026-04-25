---
name: draft-outreach
description: "Use when you say 'draft a cold email to {Acme}' / 'cold-call script' / 'follow up on today's call' / 'reply to this inbound' / 'renewal note' / 'save email for downgrade' — I draft the `stage` you pick: `cold-email`, `cold-script`, `followup`, `inbound-reply`, `renewal`, or `churn-save`. Voice-matched to your samples. Writes to `outreach/{stage}-{slug}-{date}.md`."
integrations:
  inbox: [gmail, outlook]
  crm: [hubspot, salesforce, attio]
  meetings: [gong, fireflies]
  billing: [stripe]
---

# Draft Outreach

One skill, every outreach surface. `stage` param pick shape; voice-match, honest proof, "never invent quote" discipline shared.

## Parameter: `stage`

- `cold-email` — grounded first-touch email (3 short paragraphs max): cited trigger signal → specific pain → one-line ask. Replaces generic "who handles X" email.
- `cold-script` — 60-90s cold-call script: opener, pattern-interrupt, 2 discovery questions, soft CTA, landmine to avoid.
- `followup` — post-call recap + confirmed next step email, your voice. Pulls call analysis from `calls/{slug}/`.
- `inbound-reply` — classify inbound as `interested` / `asking-question` / `objection` / `not-now` / `unsubscribe`, draft right reply. Flags spam / wrong-person clean.
- `renewal` — bundle shipped outcomes, expansion levers, pricing reasoning into renewal draft. Never commits pricing outside playbook.
- `churn-save` — non-defensive save. Names specific signal (downgrade, usage drop, support escalation), offers one concrete remedy, proposes dated next step. No guilt, no fake scarcity.

User names stage in plain English ("cold email", "call script", "follow up", "reply", "renewal note", "save email") → infer. Ambiguous → ask ONE question naming 6 options.

## When to use

- Explicit: any trigger phrase in description.
- Implicit: inside `analyze subject=discovery-call` (analysis ends with drafted followup), inside `score subject=customer-health` (red → churn-save), inside `manage-crm action=route` (interested inbound → cold-email or followup).

## Ledger fields I read

Reads `config/context-ledger.json` first.

- `playbook` — from `context/sales-context.md`. Required all stages (objection handbook, pricing stance, primary first-call goal, competitors, ICP). Missing → "want me to draft your playbook first? (`define-playbook`, ~5m)" and stop.
- `universal.voice` — tone summary + samples. Missing → ask ONE ("connect your inbox via Integrations and I'll sample your last 30 sent messages — or paste 3-5 emails you wrote"). Required for `cold-email`, `followup`, `inbound-reply`, `renewal`, `churn-save`.
- `universal.icp` — pains + triggers ground `cold-email` and `cold-script`.
- `domains.crm.slug` — pull deal context (owner, stage, last touch) for `followup`, `renewal`, `churn-save`. Missing → ask ONE: "Which CRM — HubSpot, Salesforce, Attio, Pipedrive, Close? Or paste the deal context."
- `domains.retention.billing` — `churn-save` uses downgrade / cancel signal from Stripe if available.

## Steps

1. **Read ledger + playbook.** Gather missing required fields per above (ONE question each, best-modality first). Write atomically.

2. **Branch on stage.**
   - `cold-email`: run fresh signal search (recent news, job openings, funding, product launch) via Composio-discovered scrape / search slugs. Pick SINGLE strongest signal. Open with specific signal line 1 (not "hope this finds you well"). Draft 3 short paragraphs: signal → specific pain (from playbook, grounded in ICP) → one-line ask. Subject cites signal. Max 110 words body. Save to `outreach/email-{lead-slug}-{YYYY-MM-DD}.md`.
   - `cold-script`: dossier from `leads/{slug}/` (or ask). Structure: **Opener** (15s, reason for call), **Pattern-interrupt** (one specific observation unique to them), **Discovery** (2 questions matched to weakest qualification pillar for segment from playbook), **Soft CTA** (calendar link, 15m next week), **Landmine to avoid** (one thing from `call-insights/` flagged loss pattern). Save to `outreach/script-{lead-slug}-{YYYY-MM-DD}.md`.
   - `followup`: read latest `calls/{deal-slug}/notes-*.md` and `analysis-*.md`. Subject: "Re: {their pain, in their words}". Body: confirm we heard them → 2-3 bullets answering stated objection / open question → next step with specific date. Match voice. Save to `deals/{deal-slug}/followup-{YYYY-MM-DD}.md` AND mirror to `outreach/email-{deal-slug}-{date}.md` for outreach index.
   - `inbound-reply`: read pasted or Composio-pulled reply. Classify (interested / asking-question / objection / not-now / unsubscribe / spam). `interested` → draft booking reply with 2-3 slot suggestions (pull Google Calendar if connected). `asking-question` → answer inline if playbook covers; else flag for user. `objection` → chain into `handle-objection`. `not-now` → draft polite "circle back in {N} weeks" note. `unsubscribe` / `spam` → queue right CRM action via `manage-crm action=queue-followup` and stop. Save to `outreach/inbound-reply-{lead-slug}-{YYYY-MM-DD}.md`.
   - `renewal`: read `customers/{slug}/` history (onboarding plan, QBRs, health scores). Structure: shipped outcomes (numbers from playbook's success-metric definition) → expansion levers (feature-request patterns, team growth signal) → pricing reasoning (from playbook — never commit). End dated next step. Save to `customers/{slug}/renewal-{YYYY-MM-DD}.md`.
   - `churn-save`: read downgrade / cancel / usage-drop signal (from Stripe via Composio, or pasted). Structure: name specific signal verbatim → one concrete remedy (pause, downgrade further, concierge help, refund — genuine option matching signal, not all four) → proposed dated next step. No guilt, no fake scarcity. Save to `customers/{slug}/save-{YYYY-MM-DD}.md`.

3. **Voice check.** Before finalize, compare against `config/voice.md`: sentence length, greeting habit, closing habit, forbidden phrases. Rewrite offending lines.

4. **Sanity-check against playbook.** Any claim re pricing, timelines, anchor accounts must match `context/sales-context.md`. No commitments outside pricing stance. No fabricated customer names.

5. **Append to `outputs.json`** — read-merge-write atomically: `{ id (uuid v4), type: "outreach", title: "{Stage} — {target}", summary: "<subject line + next step>", path, status: "draft", createdAt, updatedAt, domain: "<outbound | inbound | retention>"}`. Domain: `cold-email` + `cold-script` → `outbound`; `inbound-reply` → `inbound`; `followup` → `meetings`; `renewal` + `churn-save` → `retention`.

6. **Summarize to user.** Subject line + next step inline. Path to full draft. Explicit: "I never send — copy from file or open inbox to send."

## What I never do

- Send, post, schedule. Every draft stays in file until you copy.
- Invent customer quote, metric, competitor claim. Source thin → mark `TBD — {what to bring}` and ask.
- Commit pricing outside playbook's pricing stance — surface exception with `FLAG: needs approval`.
- Use guilt, fake scarcity, dark patterns in `churn-save` / `renewal`.
- Hardcode tool names — Composio discovery at runtime only.

## Outputs

- `outreach/{channel}-{slug}-{YYYY-MM-DD}.md` where `channel` = `email` (cold-email, followup, inbound-reply) / `script` (cold-script).
- `followup`: mirrors into `deals/{slug}/followup-{date}.md`.
- `renewal` / `churn-save`: writes to `customers/{slug}/`.
- Appends to `outputs.json` with `type: "outreach"`.