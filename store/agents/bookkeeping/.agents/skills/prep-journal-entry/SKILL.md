---
name: prep-journal-entry
description: "Use when the user says 'book the accrual JE' / 'draft the depreciation JE for Q1' / 'post the prepaid amortization' / 'revrec this period' / 'stock-comp JE' / 'reclass this expense'  -  I draft a balanced double-entry JE that branches on `type`: `accrual` | `prepaid` | `payroll` | `revrec` | `depreciation` | `stock-comp` | `adjustment` | `reclass`. Every JE is validated balanced to 1 cent, every GL code is validated against `config/chart-of-accounts.json`, and the entry is written at `status: \"draft\"`. Sub-mode `type=accrual mode=reversing` auto-reverses every active accrual flagged `reversing=true`. Draft-only  -  I never post to QBO / Xero."
version: 1
tags: [bookkeeping, prep, journal]
category: Bookkeeping
featured: yes
image: ledger
integrations: [quickbooks, xero, linear]
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Prep Journal Entry

One balanced JE from type-specific template. Invariants enforced every write: debits equal credits within 1 cent, every `glCode` exists in locked CoA, `status: "draft"` (never `posted` without explicit user confirm), `reversing: true` requires `reversesEntryId` + opposite sign convention.

Draft-only: write markdown + index row; user/accountant post to QBO / Xero.

## When to use

- "book the accrual JE" / "draft the depreciation JE for Q1" / "post the prepaid amortization".
- "revrec JE for March" / "stock-comp JE for the period".
- "reclass this $X from G&A to R&D" / "book this adjustment".
- Called by `run-monthly-close` for every due standard JE in close loop.

## Steps

1. **Parse inputs.** Required: `type` (one of `accrual` | `prepaid` | `payroll` | `revrec` | `depreciation` | `stock-comp` | `adjustment` | `reclass`) and `period` (`YYYY-MM`). Optional: `mode` (only meaningful when `type=accrual`  -  `reversing`), short `slug` for filename.

2. **Read context.** Load `context/bookkeeping-context.md` (stop if missing), `config/context-ledger.json`, `config/chart-of-accounts.json` (**locked** for run  -  stop if absent), `accruals.json` (empty array if absent). For payroll / depreciation / stock-comp, also read type-specific config (below).

3. **Branch on `type`.** Each branch builds `lines[]` array; Step 4 validates before writing.

   ### `accrual`
   Period-end accrual (unbilled revenue, accrued payroll, accrued interest). Debit expense / revenue line, credit `Accrued Liabilities` (or debit `Accrued Revenue` + credit revenue). `reversing: true` by default. Append to `accruals.json`: `{id, type, active: true, reversing: true, period, amount, glCode, counterGlCode, memo, createdAt, updatedAt}`.

   **`mode=reversing` sub-mode.** Read `accruals.json`, find every entry with `active=true AND reversing=true AND period < current`. For each, produce reversing JE with `reversesEntryId` pointing at original and sign convention flipped. Mark original `active: false` and set `reversedOn`. Write each reversal as separate JE.

   ### `prepaid`
   Amortize prepaid (rent, SaaS, insurance). Debit expense GL, credit prepaid-asset GL. `reversing: false`. Memo: `"Amortize {asset}  -  {period}"`.

   ### `payroll`
   Pay-period summary. Source order: connected app (`composio search payroll` → Gusto / Rippling / Justworks / Deel / ADP, schema via `--get-schema`) > pasted summary `{gross, taxes, benefits, netPay, byDepartment: {rd, sm, ga}}`. Lines: debit `Wages  -  R&D / S&M / G&A` per CoA, debit `Payroll Taxes`, debit `Employee Benefits`; credit `Wages Payable` (or `Cash` if paid in-period  -  ask once), `Payroll Tax Liabilities`, `Benefits Payable`. Memo: `"Payroll  -  {period}  -  {provider}"`.

   ### `revrec`
   Read every `revrec/**/*.json`, pick rows with `period = current`. Debit `Deferred Revenue`, credit revenue GL. Multi-currency → aggregate in home currency (already on schedule). Memo: `"Revrec  -  {period}  -  {N} contracts"`.

   ### `depreciation`
   Read `config/fixed-assets.json` (shape: `[{id, description, class, cost, salvage, usefulLifeMonths, inServiceOn, method: "straight-line"}]`). If absent, ask ONCE for schedule (file > paste)  -  NEVER invent. Compute `(cost - salvage) / usefulLifeMonths` per asset, group by class. Debit `Depreciation Expense  -  {class}`, credit `Accumulated Depreciation  -  {class}`. Memo: `"Depreciation  -  {period}  -  {N} assets"`.

   ### `stock-comp`
   Read `config/stock-comp.json` (shape: `{valuation: {fmv, asOf}, grants: [{employeeId?, grantDate, shares, strike, vestingMonths, cliff}]}`). If absent, ask ONCE for 409A + vesting schedule. Linear expense after cliff per ASC 718. Debit `Stock-Based Compensation Expense` (split by R&D / S&M / G&A if CoA supports), credit `Additional Paid-in Capital`. Memo: `"SBC  -  {period}  -  {N} grants"`. If `context/bookkeeping-context.md` flags SBC as hard-no without sign-off, stop and surface draft for approval.

   ### `adjustment`
   General manual adjustment. User dictates `{glCode, debit, credit, memo}` per line (2+ lines). Common sources: unrecorded fees from reconciliations, forex rounding, prior coding corrections.

   ### `reclass`
   Inputs `{fromGlCode, toGlCode, amount, memo}`. Debit `toGlCode`, credit `fromGlCode`. Both should be expense-or-asset lines; cross-section (expense → liability) requires `type=adjustment` instead.

4. **Validate before write.** Hard guards  -  failure stops write, surfaces error:
   - `sum(debits) === sum(credits)` within 1 cent.
   - Every `glCode` exists in `config/chart-of-accounts.json` (not just parent  -  exact code).
   - `lines[].length >= 2`.
   - `type = reversing` implies `reversesEntryId` set AND referenced JE has `reversing: true` AND sign convention flipped.
   - No `status: "posted"` (only `draft` allowed from this skill).

5. **Write JE markdown** to `journal-entries/{YYYY-MM}/{type}-{slug}.md`. Structure:
   - Header: `id`, `type`, `period`, `date`, memo, status, reversing, reversesEntryId (if any).
   - **Lines**  -  markdown table `{glCode | glName | debit | credit | memo}`.
   - Totals row: debit total, credit total, diff (should be 0).
   - Supporting docs: paths referenced (pay-period summary, revrec schedule, fixed-assets file, receipts).
   - Notes: open questions surfaced inline.

6. **Append to `journal-entries.json`** at agent root. Atomic read-merge-write. Full schema from `data-schema.md`: `{id, createdAt, updatedAt, date, type, memo, reversing, reversesEntryId?, period, lines[], status: "draft", supportingDocs?}`.

7. **Type-specific side effects.**
   - `accrual` (not reversing sub-mode) → append to `accruals.json` with `active: true`.
   - `accrual mode=reversing` → update original accrual row's `active: false, reversedOn, reversedByEntryId`.
   - `revrec` → stamp matching rows in relevant `revrec/{customer-slug}/{contract-slug}.json` as `recognized: true, recognizedBy: {id}` for that period.
   - `depreciation` → stamp matching rows in `config/fixed-assets.json` with `lastDepreciatedPeriod: "{period}", accumulated += monthly`.

8. **Append one `outputs.json` row**: `{type: "journal-entry", title: "{type} JE  -  {period}  -  {slug}", summary, path, status: "draft", domain: "close"}`. Read-merge-write; never overwrite.

9. **Summarize to user.** One compact block: JE id, total amount, type, path, reminder it's `draft` until user posts to QBO / Xero and confirms. Offer to flip `status: "posted"` on explicit confirm only.

## Outputs

- `journal-entries/{YYYY-MM}/{type}-{slug}.md`  -  human-readable JE with balanced lines table.
- `journal-entries.json`  -  read-merge-write, JE appended with `status: "draft"`.
- `accruals.json`  -  only on `type=accrual` (append) or `type=accrual mode=reversing` (update original row).
- `revrec/{customer-slug}/{contract-slug}.json`  -  only on `type=revrec` (stamp recognized period).
- `config/fixed-assets.json`  -  only on `type=depreciation` (stamp last depreciated period + accumulated).
- `outputs.json`  -  one row appended, `type: "journal-entry"`.