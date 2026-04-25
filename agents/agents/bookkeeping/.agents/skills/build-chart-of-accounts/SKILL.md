---
name: build-chart-of-accounts
description: "Use when user says 'draft our chart of accounts' / 'we need a CoA' / 'revise the CoA to break out R&D' / 'add a deferred-revenue line' — produce startup-optimized CoA with R&D / S&M / G&A opex breakouts, deferred revenue, accrued PTO, SAFE-note equity lines, per-bank-account cash lines. Writes `config/chart-of-accounts.json`. Supports in-place revision preserving unchanged codes."
---

# Build Chart of Accounts

Skill OWNS `config/chart-of-accounts.json` — authoritative CoA.
Treated **immutable during any categorization run** (see
`process-statements` Step 1). Revisions land here only. CoA =
shape of every financial statement agent produces. Breakouts
opinionated for early-stage startups: R&D visibility for credit,
S&M / G&A split for gross-margin framing, accrual-ready liability
lines even if company still on cash.

Draft-only: never push CoA to QBO / Xero. Founder or accountant
mirrors into accounting system.

## When to use

- "draft our chart of accounts" / "we need a CoA" / "we don't have
  one yet".
- "revise the CoA to break out R&D" / "add a deferred-revenue line" /
  "split hosting out of COGS".
- Called implicitly by `import-historical-books` when prior export
  includes CoA and ours missing.
- Called implicitly by `process-statements` Step 1 if CoA absent —
  but only after confirming inline.

## Steps

1. **Read config.** Load `config/context-ledger.json`. Required
   fields for good first-pass CoA:
   - `universal.company.entityType` (drives equity section — c-corp
     gets common + preferred + APIC; LLC gets member capital).
   - `universal.accountingMethod` (cash-only can omit deferred-rev,
     accrued-PTO lines on request — default include so switch to
     accrual frictionless).
   - `domains.banks.accounts[]` (one Cash sub-line per bank account,
     named with last4 so reconciliations map 1:1).
   - `domains.revenue.model` (usage model gets Usage Revenue
     sub-line; services gets Services Revenue separate from
     recurring).
   - `domains.payroll.stockCompPosture` (non-"none" posture gets
     Stock-Based Compensation expense + APIC-SBC equity lines).

   Any missing required field: ask ONE targeted question
   (modality hint: connected app > file > URL > paste), write
   atomically, continue.

2. **Read existing CoA if present.** If
   `config/chart-of-accounts.json` exists, load it. This run =
   revision, not rewrite. **Preserve every code unchanged.**
   Propose diffs (adds / renames / reparents) and confirm with user
   before writing. Never reassign code from one name to different
   concept — silently reroutes every historical transaction that
   matched old code.

3. **Assemble startup-optimized CoA.** Use structure below. Codes
   are strings; keep numeric ordering within each type so reports
   sort naturally.

   **Assets (10000-19999)**
   - Cash — one sub-line per bank account from
     `domains.banks.accounts[]`, named `Cash — {bank} {last4}`. GL
     code format: `1{nnnn}`. Add `Cash — Stripe` line if Stripe
     connected as payment processor.
   - Accounts Receivable.
   - Prepaid Rent, Prepaid SaaS, Prepaid Insurance (separate lines —
     amortize on different schedules).
   - Fixed Assets (plus paired Accumulated Depreciation — negative
     asset, shown as contra line).

   **Liabilities (20000-29999)**
   - Accounts Payable.
   - Accrued Payroll, Accrued PTO (separate from payroll — PTO hits
     expense line over time, not at cutover).
   - Accrued Expenses (generic).
   - Deferred Revenue — short-term (<12mo) + long-term (>12mo) as
     separate lines for balance sheet split.
   - SAFE Notes, Convertible Notes (separate lines — different
     accounting posture on conversion).
   - Income Tax Payable.

   **Equity (30000-39999)**
   - C-corp: Common Stock, Preferred Stock, APIC, APIC-SBC (if
     stock-comp posture ≠ none), Retained Earnings.
   - LLC: Member Capital, Member Draws, Retained Earnings.
   - S-corp: Common Stock, APIC, Distributions, Retained Earnings.

   **Revenue (40000-49999)**
   - Recurring Revenue (subscription MRR / ARR).
   - One-Time Revenue.
   - Usage Revenue (only if `revenue.model ∈ {usage, mix}`).
   - Services Revenue (only if `revenue.model ∈ {services, mix}`).
   - Contra-revenue: Refunds & Credits (negative).

   **COGS (50000-59999)**
   - Hosting / Infrastructure (AWS, GCP, Vercel).
   - Third-Party API Fees (usage-billed APIs part of COGS, not R&D
     tools).
   - Payment Processing (Stripe, card fees).
   - Customer Support (if team size ≥ 10 and support function
     exists).

   **Opex (60000-79999)** — opinionated breakout makes CoA
   startup-useful. Statement section prefixes keep P&L grouped:

   - **R&D** (60000-64999) — R&D Wages, R&D Contractors, R&D
     Software, R&D Cloud (dev/staging, separate from COGS hosting),
     R&D Other. `statementSection: "operating-expenses.rd"`.
   - **S&M** (65000-69999) — S&M Wages, Advertising, Events &
     Sponsorships, S&M Tools (HubSpot, Apollo, etc.), S&M Other.
     `statementSection: "operating-expenses.sm"`.
   - **G&A** (70000-79999) — G&A Wages, Legal, Accounting, Rent,
     Insurance, G&A SaaS (Slack, Notion, 1Password, etc.), Office
     Supplies, Travel & Meals, G&A Other.
     `statementSection: "operating-expenses.ga"`.

   **Other (80000-89999)** — below-the-line.
   - Interest Income, Interest Expense.
   - FX Gain / Loss.
   - Gain / Loss on Disposal of Fixed Assets.

   **Suspense (99999)** — `statementSection:
   "operating-expenses.ga"` so visible on P&L. Matches ledger's
   `universal.suspenseCode`.

4. **Schema.** Every row:

   ```ts
   {
     code: string;             // ALWAYS a string, never a number
     name: string;
     type: "asset" | "liability" | "equity" | "revenue" | "cogs" | "expense";
     parent?: string;          // code of the parent row for grouped display
     statementSection: string; // e.g. "operating-expenses.rd", "assets.current"
     description?: string;     // one-line disambiguation for categorizers
   }
   ```

5. **Validate before writing.**
   - Every `code` is string and unique across whole CoA.
   - Codes sort numerically within each `type` (no 60500 between
     65000 and 65500 — keep ranges clean).
   - Every `type` has at least one row (no empty sections).
   - Every `parent` (if set) resolves to row in CoA.
   - Every `statementSection` one of allowed sections:
     `assets.current`, `assets.noncurrent`, `liabilities.current`,
     `liabilities.noncurrent`, `equity`, `revenue`,
     `contra-revenue`, `cogs`, `operating-expenses.rd`,
     `operating-expenses.sm`, `operating-expenses.ga`, `other`.

6. **Write atomically.** Write `config/chart-of-accounts.json.tmp`,
   then rename. Update
   `config/context-ledger.json → universal.coa` with
   `{present: true, path: "config/chart-of-accounts.json", framework,
   lastUpdatedAt}` (read-merge-write).

7. **Revision safeguard.** If revision:
   - Compare against prior CoA. For any **removed** code, check
     `config/prior-categorizations.json` and warn if any vendor
     still maps to that code — user must remap vendors or keep
     code.
   - For any **renamed** code (same code, different name), update
     `name` in place — categorizations keyed on `code` safe.
   - For any **newly added** code, log in user-facing summary so
     founder knows it exists for next run.

8. **DO NOT append to `outputs.json`.** CoA is config, not
   deliverable.

9. **Summarize to user.** Counts per type, any adds / renames /
   warnings, next move ("drop statements into
   `statements/_inbox/` and I'll categorize against this CoA").

## Outputs

- `config/chart-of-accounts.json` — authoritative CoA, schema per
  Step 4.
- `config/context-ledger.json` — `universal.coa` refreshed
  (read-merge-write).

No entry in `outputs.json`.