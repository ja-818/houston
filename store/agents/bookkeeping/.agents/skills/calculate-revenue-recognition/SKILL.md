---
name: calculate-revenue-recognition
description: "ASC 606 schedule per contract. One JSON artifact per contract, organized by customer. Handles common startup patterns: annual upfront with monthly ratable, usage-based with floor, implementation-fee deferral, contract modifications (prospective vs. cumulative catch-up). Judgment calls (variable consideration, significant financing, non-cash) flagged + routed to user  -  I summarize options, never decide."
version: 1
tags: [bookkeeping, calculate, revenue]
category: Bookkeeping
featured: yes
image: ledger
integrations: [hubspot, stripe]
---

# Calculate Revenue Recognition

ASC 606 schedule per contract. One JSON artifact per contract, organized by customer. Handles common startup patterns: annual upfront with monthly ratable, usage-based with floor, implementation-fee deferral, contract modifications (prospective vs. cumulative catch-up). Judgment calls (variable consideration, significant financing, non-cash) flagged + routed to user  -  I summarize options, never decide.

## When to use

- "build the revrec schedule for {customer}" / "spread this contract".
- "the customer renewed / upgraded / added a SKU  -  update revrec".
- "we invoiced this annually; recognize it monthly".
- Called by `run-monthly-close` as part of revrec pass, once per active contract.

## Steps

1. **Read context.** Load `context/bookkeeping-context.md`, `config/context-ledger.json` (needs `domains.revenue`  -  model + ASC 606 posture + contract source), `config/chart-of-accounts.json` (needs deferred-revenue + revenue GL codes). If `domains.revenue` missing, ask ONE targeted question with modality hint (connected app > file > URL > paste), persist, continue.

2. **Load contract.** Source ranking: connected app (Stripe / HubSpot via Composio  -  discover slugs at runtime with `composio search billing` / `composio search crm`) > dropped file (CSV / PDF / DOCX) > URL > paste. Extract:
   - `customer`  -  name + internal id if available.
   - `contractId`  -  vendor-side id if available, else slug.
   - `effectiveDate`, `endDate`.
   - Line items (SKU, description, quantity, unit price, billing cadence, start/end dates, is-usage-based flag, floor if any).
   - Payment terms (upfront / monthly / net-30).
   - Non-cash or variable consideration language.

3. **Identify performance obligations.** Per line item, decide distinct PO or combine:
   - Standalone SaaS subscription → one PO per subscription term.
   - Implementation / onboarding fee → distinct PO only if service separately useful; else combine with subscription, amortize over contract life. Flag either way.
   - Usage-based overage → variable consideration on same PO as underlying subscription.
   - Professional services with defined deliverables → one PO per deliverable.

   Output array `performanceObligations[]`:
   `{id, description, standaloneSellingPrice, recognitionPattern:
   "ratable" | "point-in-time" | "usage" | "milestone",
   startDate, endDate}`.

4. **Compute transaction price.** Sum fixed consideration across all POs. Add floor (if any) for usage-based items. Flag  -  do NOT auto-include  -  any:
   - **Variable consideration** (volume tiers, performance bonuses, rebates). Summarize options (expected value vs. most-likely amount), stop for user confirmation.
   - **Significant financing component** (payment > 12 months from transfer of control). Summarize, stop.
   - **Non-cash consideration** (equity, tokens, barter). Summarize, stop.

   Never invent treatment. Flagged items land in `judgmentCalls[]` array with options + recommendation.

5. **Allocate transaction price across POs.** Use standalone selling price (SSP) as default allocation base. If SSP for implementation fee not observable, use residual approach + flag. Produce `allocation[]`  -  `{poId, allocatedAmount, method}`.

6. **Build monthly recognition schedule.** Per PO, apply recognition pattern:
   - **Ratable** (annual upfront, monthly ratable): `allocatedAmount /
     months_in_term`, each month from `startDate` to `endDate`.
   - **Usage-based with floor**: recognize floor ratably across term; recognize usage above floor in month earned (leave placeholder rows  -  user plugs actuals via close).
   - **Implementation-fee deferral**: amortize `allocatedAmount /
     months_in_contract_life`, straight-line across full term.
   - **Point-in-time / milestone**: single row on recognition date.

   Emit `schedule[]`: `{period, poId, amount, cumulativeRecognized,
   method}`. `cumulativeRecognized` running per PO + total.

7. **Handle contract modifications.** If user flags as modification of prior contract (upsell, downsell, term extension):
   - **Prospective** (adds distinct goods/services at SSP): treat as new contract; start new schedule from modification date.
   - **Cumulative catch-up** (changes price of existing POs, no new distinct goods): recompute revised total, re-allocate, post catch-up adjustment in modification period.

   Treatment decision = judgment call  -  summarize both options with dollar impact, stop for user confirmation.

8. **Draft supporting JE stubs.** Per row in `schedule[]`, generate draft JE outline (Dr deferred revenue / Cr revenue, or Dr contract asset / Cr revenue as appropriate). Do NOT write to `journal-entries.json` here  -  user runs `prep-journal-entry type=revrec` to persist. Include in output JSON so downstream JE skill has ready input.

9. **Write artifact.** Slugify `customer` + `contractId`. Path: `revrec/{customer-slug}/{contract-slug}.json`. Atomic write: `.tmp` → rename. Full schema:
   ```jsonc
   {
     "id": "<uuid>",
     "createdAt": "...",
     "updatedAt": "...",
     "customer": { "name": "...", "slug": "..." },
     "contract": { "id": "...", "slug": "...", "effectiveDate": "...", "endDate": "..." },
     "performanceObligations": [ /* step 3 */ ],
     "transactionPrice": 120000.00,
     "allocation": [ /* step 5 */ ],
     "schedule": [ /* step 6 */ ],
     "judgmentCalls": [ /* step 4 + step 7 */ ],
     "jeStubs": [ /* step 8 */ ],
     "status": "draft"
   }
   ```

10. **Append to `outputs.json`.** Read-merge-write. One row per contract artifact: `{id, type: "revrec-schedule", title: "RevRec
     -  {customer} / {contract}", summary: "<2-3 sentences on
    transaction price, term, and any judgment calls>", path,
    status: "draft", domain: "close"}`.

11. **Summarize to user.** One paragraph: transaction price, term, monthly recognition amount, and  -  most important  -  any `judgmentCalls` blocking finalization. Per judgment call, list options + recommended treatment + dollar impact, wait for confirmation before flipping `status: "ready"`.

## Outputs

- `revrec/{customer-slug}/{contract-slug}.json` (per-contract schedule)
- `outputs.json` row: `type: "revrec-schedule"`, `domain: "close"`, `status: "draft"` until user signs off on every judgment call.