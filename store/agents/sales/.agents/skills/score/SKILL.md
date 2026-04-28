---
name: score
description: "Use when you say 'score this lead' / 'is this a fit' / 'bulk-score my leads' / 'which deals are slipping' / 'who's red in my book'  -  I apply the `subject` you pick: `lead` (bulk-score every un-scored lead against the playbook) · `icp-fit` (single-lead fit + angle) · `deal-health` (time-in-stage + qualification + touch recency  -  GREEN / YELLOW / RED) · `customer-health` (usage + NPS + support + billing via connected PostHog and Stripe). Top 2 drivers named per row  -  no black-box numbers. Writes to `scores/{subject}-{YYYY-MM-DD}.md`."
version: 1
tags: [sales, score]
category: Sales
featured: yes
image: handshake
integrations: [hubspot, salesforce, attio, stripe]
---


# Score

One skill, four scoring surfaces. `subject` param picks rubric. "Transparent drivers, no magic numbers" discipline shared.

## Parameter: `subject`

- `lead`  -  bulk-score every un-scored lead in `leads.json` (plus any new-leads view in connected CRM). System-wide pass, not single-lead. Returns ranked table.
- `icp-fit`  -  single named lead: fit score + angle to pitch. Fast, one-row.
- `deal-health`  -  every open deal in `deals.json` (or connected CRM open-deal view). Drivers: time-in-stage, qualification completeness, touch recency. Returns per-deal GREEN / YELLOW / RED.
- `customer-health`  -  every current customer in `customers.json`. Drivers: product usage trend, NPS / CSAT if captured, support ticket volume, billing signal (downgrade proximity). GREEN / YELLOW / RED, top 2 drivers named per row.

User ask names subject plain English ("score leads", "fit check", "pipeline health", "who's red") → infer. Else ask ONE question naming 4 options.

## When to use

- Explicit triggers in description.
- Implicit: inside `manage-crm action=route` (route needs score); inside `draft-outreach stage=churn-save` (red customer-health row triggers save); inside `analyze subject=pipeline` (health roll-up uses per-deal scores).

## Ledger fields I read

Reads `config/context-ledger.json` first.

- `playbook`  -  from `context/sales-context.md`. Required for `lead` + `icp-fit` (ICP + disqualifiers). Required for `deal-health` (qualification framework + deal-stage exit criteria).
- `universal.icp`  -  industry, roles, pains, triggers, disqualifiers.
- `domains.crm.slug` + `dealStages`  -  `deal-health` walks stage list. Ask ONE question if missing.
- `domains.retention.healthThresholds`  -  `customer-health` applies if set; if missing, ask ONE question naming sensible defaults ("GREEN = weekly-active + NPS ≥ 30 + no downgrade signal; YELLOW = 1 concern; RED = 2+ concerns  -  sound right, or override per value?").

## Steps

1. **Read ledger + playbook.** Gather missing required fields (ONE question each, best-modality first). Write atomically.

2. **Pull population.**
   - `lead`: read `leads.json` + `composio <crm> get-new-leads` (or equivalent for connected CRM).
   - `icp-fit`: named lead row (or pasted data).
   - `deal-health`: `deals.json` + `composio <crm> get-open-deals`.
   - `customer-health`: `customers.json` + `composio <crm> get-customers`; pull billing signal via Stripe; pull usage signal via PostHog / Mixpanel / Amplitude if connected.

3. **Score, per rubric.**
   - `lead` / `icp-fit`: per row, compare against playbook ICP + disqualifiers. Score each dimension 0-3. Drop hard disqualifiers to RED. Sum → GREEN (≥ 80%) / YELLOW (50-79%) / RED (< 50% or any disqualifier). Produce **angle** (single pain from playbook) for each GREEN.
   - `deal-health`: three drivers per deal  -  **time in stage** vs playbook baseline (RED if >2x baseline), **qualification** (% of framework pillars covered  -  RED if <50%), **touch recency** (days since last meaningful touch  -  RED if >14 in active stages). Overall = worst driver.
   - `customer-health`: per-customer drivers  -  **usage trend** (% of prior-4-week baseline), **NPS / CSAT** if captured, **support tickets** (count × severity, if accessible), **billing signal** (downgrade or cancel in flight). Overall = worst driver. Name top 2 drivers per row.

4. **Write scored batch** atomically to `scores/{subject}-{YYYY-MM-DD}.md`  -  ranked table + drivers per row + suggested next moves. For `icp-fit` single-row, same shape but one row.

5. **Update relevant entity file.**
   - `lead` + `icp-fit`: update `leads.json` row with `fitScore` + `scoredAt`.
   - `deal-health`: update `deals.json` row with `healthScore` + `healthDrivers` + `scoredAt`.
   - `customer-health`: update `customers.json` row with `healthColor` + `healthDrivers` + `scoredAt`.

6. **Append to `outputs.json`**  -  read-merge-write atomically: `{ id (uuid v4), type: "score", title: "{Subject} score  -  {YYYY-MM-DD}", summary: "<N rows. {R} red, {Y} yellow, {G} green.>", path, status: "ready", createdAt, updatedAt, domain: "<outbound (lead/icp-fit) | crm (deal-health) | retention (customer-health)>" }`.

7. **Summarize to user.** Counts + top row to act on. Suggest next skill ("Route the GREENs with `manage-crm action=route`?" / "Draft saves for the REDs with `draft-outreach stage=churn-save`?").

## What I never do

- Invent number or signal. Every driver cites concrete data point (row, event count, days).
- Push scores into CRM without approval. Updates to `leads.json` / `deals.json` / `customers.json` local indexes; anything mutating external systems goes through `manage-crm action=queue-followup`.
- Black-box result  -  always name drivers.

## Outputs

- `scores/{subject}-{YYYY-MM-DD}.md`
- Updates `leads.json` / `deals.json` / `customers.json` rows.
- Appends to `outputs.json` with `type: "score"`.