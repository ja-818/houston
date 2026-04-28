---
name: generate-financial-statements
description: "Use when the user says 'give me the P&L' / 'draft the balance sheet' / 'cash flow statement for Q1' / 'pull the trial balance'  -  I branch on `statement`: `pnl` | `balance-sheet` | `cash-flow` | `trial-balance` and produce the statement for the requested period with PoP comparison and auto-generated notes. Reads journal-entries.json + CoA + opening balances; writes `financials/{YYYY-MM}/{statement}.md` and appends to `outputs.json` as `financial-statement`."
version: 1
tags: [bookkeeping, generate, financial]
category: Bookkeeping
featured: yes
image: ledger
---


# Generate Financial Statements

Four statements, one skill, one branch arg. Every branch ground numbers in `journal-entries.json` + `config/opening-trial-balance.json` + CoA. Cash and accrual views both run when method `accrual`; cash only when method `cash`. All comparisons cite source  -  nothing invented.

## When to use

- `pnl`  -  "give me the P&L" / "income statement for {period}".
- `balance-sheet`  -  "draft the balance sheet as of {date}".
- `cash-flow`  -  "cash flow statement for {period}".
- `trial-balance`  -  "pull the trial balance" / "TB as of {date}".
- Called by `run-monthly-close` once per statement after accruals + revrec land.

## Steps

1. **Read context.** Load `context/bookkeeping-context.md`, `config/context-ledger.json` (for `universal.accountingMethod` + `universal.openingBalances`), `config/chart-of-accounts.json` (LOCKED  -  statements key off `statementSection`), and `config/opening-trial-balance.json`. Parse args: `statement` (one of four) + `period` (`YYYY-MM` for P&L / cash-flow / variance; as-of date for balance-sheet / trial-balance).

2. **Load source ledger.** Read `journal-entries.json` at agent root. Filter to `status in {"ready","posted"}` (exclude `"draft"` unless user asked for draft statement). For requested period, split:
   - Period JEs (`date` within period)  -  drive P&L + cash-flow.
   - Lifetime-to-date JEs through period-end  -  drive balance-sheet + trial-balance.

3. **Branch on `statement`.**

   ### `statement=pnl`
   - Group JE lines by CoA `statementSection` under revenue / cogs / expense. Sum `credit - debit` for revenue/cogs/expense (revenue credits-positive; cogs/expense debits-positive).
   - Subtotals: Revenue → Gross Profit → Operating Income → Other Income/Expense → Net Income.
   - **Both cash and accrual views** if `accountingMethod == "accrual"` (cash view excludes accrual/prepaid/revrec/deferred-revenue JEs by `type`). Cash-only if `accountingMethod == "cash"`.
   - **PoP comparison**: MoM (vs. prior month finalized P&L from `financials/{prior-YYYY-MM}/pnl.md` if present, else recompute on fly) AND vs. same period prior year.
   - **Notes (3-5)**  -  auto-gen on biggest variance drivers. Each note MUST cite JE ids or transaction set from run artifact. No invented causes.

   ### `statement=balance-sheet`
   - Classified: current assets, non-current assets, current liabilities, non-current liabilities, equity. Grouping driven by CoA `statementSection`.
   - As-of balance per GL = opening balance (from `config/opening-trial-balance.json`) + sum of all JE lines hitting that GL through as-of date.
   - **Equity tie-out**: Opening equity + YTD net income (from running P&L) + paid-in-capital movements + equity-grants must equal computed equity section. Gap > $0.01 = flag.
   - **PoP comparison**: vs. prior month-end AND prior year-end.
   - **Flag unusual balances**: credit AR, debit AP, negative cash, negative inventory, negative deferred revenue. Each flag names GL + balance + recommended action.

   ### `statement=cash-flow`
   - **Indirect method.** Start from Net Income (P&L for period).
   - Add back non-cash: depreciation, amortization, stock-based-comp (JEs with `type: "depreciation"` or `type: "stock-comp"`).
   - Working-capital + deferred revenue movement: `delta(AR)`, `delta(AP)`, `delta(prepaid)`, `delta(deferred-revenue)`, `delta(accrued-liabilities)` between prior-period-end and this period-end.
   - Split: operating / investing / financing. Investing = fixed asset purchases + disposals. Financing = equity raises + debt + distributions.
   - **Ending cash reconciliation**: ending cash per cash-flow must equal sum-of-cash-GLs from balance sheet within $0.01. Gap = flag at top; DO NOT silently plug.

   ### `statement=trial-balance`
   - Every GL account with ending debit or credit balance as of requested date. Group by `statementSection`.
   - **Debits = credits within $0.01**  -  if out-of-balance, flag prominently at top with delta + short list of most-recent JEs maybe unbalanced.
   - **Cross-tie**: TB-implied P&L net income must equal P&L net income from `pnl` branch. Equity section must tie to balance-sheet equity. Mismatch = flag.

4. **Write statement.** Path: `financials/{YYYY-MM}/{statement}.md` (use period-end `YYYY-MM` for `balance-sheet` / `trial-balance` too). Atomic write: `.tmp` → rename. Structure:
   - Header: statement name, entity, period / as-of date, accounting method.
   - Numbers table(s).
   - PoP comparison block (where applicable).
   - Flags block (unusual balances, out-of-balance, recon gaps).
   - Notes block (3-5 for P&L and cash-flow, each citing JE ids or transaction sets).
   - Footer: sources (journal-entries.json hash, opening-TB date, CoA version).

5. **Append to `outputs.json`.** Read-merge-write. Row: `{id, type: "financial-statement", title: "{Statement}  -  {period}", summary: "<2-3 sentences with the headline number + biggest driver>", path: "financials/{YYYY-MM}/{statement}.md", status: "draft", domain: "reporting"}`.

6. **Never invent.** Every number ties to JE id or GL opening balance. Every note cites evidence. GL codes stay text. If user asks for period before opening-balance date, refuse and explain.

7. **Summarize to user.** One short paragraph:
   - `pnl`: revenue, gross margin, net income, biggest MoM mover.
   - `balance-sheet`: total assets, cash, unusual flags.
   - `cash-flow`: operating cash flow, investing, financing, ending cash (with recon status).
   - `trial-balance`: in-balance Y/N, total debits = total credits, out-of-balance delta if any.
   Point user at written file. Call out any flags.

## Outputs

- `financials/{YYYY-MM}/pnl.md`
- `financials/{YYYY-MM}/balance-sheet.md`
- `financials/{YYYY-MM}/cash-flow.md`
- `financials/{YYYY-MM}/trial-balance.md`
- `outputs.json` row: `type: "financial-statement"`, `domain: "reporting"`, `status: "draft"` until user flips to `ready`.