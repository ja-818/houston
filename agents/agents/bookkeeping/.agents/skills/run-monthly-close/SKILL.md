---
name: run-monthly-close
description: "Use when the user says 'close the books for {month}' / 'run month-end' / 'close March' — I orchestrate the whole close: reconcile every account, refresh the accrual register, draft every due standard JE, run a cutoff check, generate P&L + balance sheet + cash flow, run variance analysis, and assemble a close package at `closes/{YYYY-MM}/package.md` with links to every sub-artifact. Open items (recon breaks > $100, uncategorized > 10%, stale accruals > 90d, JEs still in draft) land at the top of the package. Sub-invocation `step=cutoff-check` runs just the cutoff sub-step standalone. Draft-only: I never post JEs, never file, never move money."
---

# Run Monthly Close

Orchestrator for close vertical. Month closes when every account reconciles, every due JE drafted, cutoff checked, financial statements tie out, variance explained, package signed off. I chain skills owning each step; never do their work inline.

Invariants preserved: every GL code exists in locked `config/chart-of-accounts.json`, every JE balances within 1 cent, recon breaks never silently plugged, package written at `status: "draft"` until user signs off.

Draft-only: never post JEs, never move money, never file.

## When to use

- "close the books for March" / "run month-end" / "close Q1's last month".
- "can we ship the close for {YYYY-MM}" — runs whole chain.
- `step=cutoff-check` — standalone cutoff sub-step, no looping rest of orchestration. Useful when other steps already ran and only need refresh cutoff.

## Steps

1. **Parse inputs & read context.**
   - Required: `period` (`YYYY-MM`). Parse to `{periodStart, periodEnd}`.
   - Load `context/bookkeeping-context.md` — stop if missing, ask user run `define-bookkeeping-context` first.
   - Load `config/context-ledger.json`, `config/chart-of-accounts.json` (**locked** for run — stop if absent, ask `build-chart-of-accounts`), `config/prior-categorizations.json`, `config/opening-trial-balance.json` (if present), `config/budget.json` (if present).
   - Make close folder: `mkdir -p closes/{YYYY-MM}/`.

2. **Snapshot prior-period state.** Before any writes, copy relevant `outputs.json` rows for period into `closes/{YYYY-MM}/_snapshot.json` so close reproducible if user re-runs.

3. **`step=cutoff-check` branch.** If triggered, skip to Step 7.

4. **Reconcile every account (loop `reconcile-account`).** For each account in `context-ledger.domains.banks.accounts[]`, invoke `reconcile-account` skill for `{accountLast4, period}`. Collect output path + break status. Then run `reconcile-account mode=transfer-detect` once across all accounts for period — tag inter-account transfers GL 9000 so fall out of P&L SUMIFS downstream. Do NOT proceed to Step 5 if any account returned `status: "unresolved-break"` AND break `> $100` — surface those first, wait for user's call ("plug with adjustment JE" vs. "research further").

5. **Refresh accrual register (`review-accruals`).** Invoke `review-accruals` for period. Rewrites `accruals/register.md`, read-merge-writes `accruals.json` with current set of active accruals. Capture list of accruals flagged `reversing=true` due to reverse at period open — become Step 6 inputs for reversing JE.

6. **Draft every due standard JE (loop `prep-journal-entry`).** In this order, invoke `prep-journal-entry` once per due entry; each call appends one balanced JE to `journal-entries.json`. Collect paths + ids for package.

   1. **Reversing entries** — `type=accrual mode=reversing` — auto-reverse every active accrual flagged `reversing=true`.
   2. **New accruals** — `type=accrual` — per `review-accruals` output (unbilled revenue, accrued payroll, accrued interest).
   3. **Prepaids** — `type=prepaid` — amortize rent / SaaS / insurance.
   4. **Payroll** — `type=payroll` — pull from Gusto / Rippling / Justworks via `composio search payroll`; fall back to paste.
   5. **Revrec** — `type=revrec` — recognized revenue per ASC 606 schedules in `revrec/`.
   6. **Depreciation** — `type=depreciation` — from `config/fixed-assets.json`.
   7. **Stock comp** — `type=stock-comp` — SBC per vesting schedule.
   8. **Adjustments** — `type=adjustment` JEs suggested by reconciliations (unrecorded fees, forex rounding).

   Every JE lands at `status: "draft"`. Never flip to `posted` here — needs explicit user confirmation.

7. **Cutoff check sub-step.** Build `closes/{YYYY-MM}/cutoff-check.md` with these checks:
   - **Expenses dated prior, booked current** — scan period JEs for receipt / source dates in prior period. Suggest "accrue in prior period, reverse this period".
   - **Expenses dated current, not yet booked** — pull AP aging via `composio search accounting`. Any open bill dated `≤ periodEnd` missing from this period's JEs is unrecorded liability candidate.
   - **Revenue cutoff** — invoices dated after `periodEnd` with delivery dates before `periodEnd` (ASC 606 cross-check).
   - **Cash-basis sanity** — payments `> 1%` of period opex within ±3 days of `periodEnd`.
   - **Suspense survey** — current `suspense.json` balance; flag items aged `> 90d`.

   Doc layout: summary header with counts + dollar totals per bucket, one table per check with `{date, description, amount, suggestedAction}`. Append one `outputs.json` row with `type: "books-audit", domain: "close"`. If invoked as `step=cutoff-check`, stop here; skip Steps 8+.

8. **Generate three financial statements (`generate-financial-statements` × 3).** In sequence so downstream statements can read prior ones:
   1. `statement=pnl` — writes `financials/{YYYY-MM}/pnl.md`.
   2. `statement=balance-sheet` — writes `financials/{YYYY-MM}/balance-sheet.md`. Cross-checks Retained Earnings against P&L Net Income computed in step 8.1.
   3. `statement=cash-flow` — writes `financials/{YYYY-MM}/cash-flow.md`. Reconciles ending cash line to sum of `context-ledger.domains.banks` ending balances (from recons in Step 4).

   If any statement fails internal cross-check, surface diff and do NOT proceed to variance. User makes call.

9. **Run variance analysis (`run-variance-analysis`).** Invoke once for period. If `config/budget.json` exists, skill runs actuals vs. budget; else runs vs. prior period. Captures driver decomposition + plain-English narrative. Writes `variance-analyses/{YYYY-MM}.md`.

10. **Compute open-items flags for package header.**
    - **Recon breaks > $100** — count in `recon-breaks.json` with `abs(amount) > 100` AND `status: "unresolved"`.
    - **Uncategorized > 10% of volume** — Suspense absolute dollars ÷ total period absolute volume. Flag if `> 0.10`.
    - **Stale accruals > 90d** — entries in `accruals.json` with `active=true` AND `now - createdAt > 90 days`.
    - **JEs still in draft** — count from `journal-entries.json` for period with `status: "draft"` (non-zero at first run expected — flags "post these N JEs to QBO / Xero" action item).

11. **Assemble `closes/{YYYY-MM}/package.md`.** Sections:
    - **Header** — period, status (`draft`), timestamp, four Step-10 flags rendered prominently as user's TODOs.
    - **Reconciliations** — one-line summary per account with three-way proof result and link to full recon; internal transfer pairs called out.
    - **Journal entries** — table `{id, date, type, memo, totalDebits, status}` sorted by type then date; each row links to `journal-entries/{YYYY-MM}/{slug}.md`.
    - **Cutoff check** — bucket counts + link to `cutoff-check.md`.
    - **Financial statements** — P&L, BS, CF links with headline numbers inline (Net Income, Ending Cash, Total Assets).
    - **Variance analysis** — link + 3-bullet narrative pulled verbatim from `variance-analyses/{YYYY-MM}.md`.
    - **Accruals snapshot** — counts (active / reversed / stale) + link to `accruals/register.md`.
    - **Open questions for founder** — anything child skills surfaced needing human input before flipping to `ready`.

12. **Update indexes** (atomic `.tmp` + rename, read-merge-write):
    - `outputs.json` — `{type: "close-package", title: "Close {YYYY-MM}", summary, path, status: "draft", domain: "close"}`. Child skills already appended own rows.
    - `run-index.json` — `{id, period, status: "draft", accountsIncluded[], suspenseTotal, pnlNetIncome}`. `pnlNetIncome` read verbatim from P&L.

13. **Summarize to user.** Close status + package path (clickable), four Step-10 flags with action items ("post {N} draft JEs", "resolve {M} recon breaks"), headline numbers (Net Income, Ending Cash, Runway), next move ("approve draft JEs and I flip package to `ready`").

## Sub-skill invocation contract

Each child skill (`reconcile-account`, `review-accruals`, `prep-journal-entry`, `generate-financial-statements`, `run-variance-analysis`) invoked with `period`, owns own artifact + index rows, never re-done inline. If child stops on blocker (missing config / connection), surface verbatim and pause.

## Outputs

- `closes/{YYYY-MM}/package.md` — top-level close narrative with four open-items flags at top.
- `closes/{YYYY-MM}/cutoff-check.md` — cutoff issues + unrecorded liabilities.
- `closes/{YYYY-MM}/_snapshot.json` — prior-period state snapshot for reproducibility.
- All child skill artifacts — `reconciliations/{account_last4}/{YYYY-MM}.md` × N, `journal-entries/{YYYY-MM}/*.md` × M, `financials/{YYYY-MM}/*.md` × 3, `variance-analyses/{YYYY-MM}.md`, `accruals/register.md` (rewritten).
- `outputs.json` — one row for close package + rows from every child skill.
- `run-index.json` — one row appended, `status: "draft"`.