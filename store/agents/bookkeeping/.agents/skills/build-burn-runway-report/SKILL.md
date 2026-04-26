---
name: build-burn-runway-report
description: "Use when the user says 'what's our runway' / 'refresh the burn report' / 'how many months of cash left'  -  I pull cash balances from every connected account, compute trailing 3- and 6-month net burn, project runway under a ±20% sensitivity, and call out the top-3 cost drivers. Reads context-ledger banks + latest P&L + `journal-entries.json`; writes `runway/{YYYY-MM-DD}.md` and appends to `outputs.json` as `burn-runway`."
version: 1
tags: [bookkeeping, build, burn]
category: Bookkeeping
featured: yes
image: ledger
integrations: [quickbooks, xero]
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Build Burn & Runway Report

Founder metric. One page answer: burn rate, cash left, months remaining, what if burn shift ±20%. Every number tie back to specific cash balance source or specific P&L line  -  nothing invented.

## When to use

- "what's our runway" / "how many months of cash".
- "refresh the burn report" / "rebuild the runway sheet".
- "if we grew burn 20%, how does runway change".
- Called by `run-monthly-close` after P&L lands; also called by `prep-investor-financials` to refresh runway block.

## Steps

1. **Read context.** Load `context/bookkeeping-context.md`, `config/context-ledger.json` (need `domains.banks.accounts[]` to know which cash accounts exist), `config/chart-of-accounts.json` (identify which GLs are cash / cash-equivalents). Note today date  -  drives filename.

2. **Pull current cash balances.** For each account in `context-ledger.domains.banks.accounts[]`, source balance this priority order:
   - **Connected app**  -  QBO / Xero / bank feed via Composio. Discover right tool at runtime (`composio search accounting` / `composio search banking`). Execute by slug; never hardcode tool names. No live connection → tell user which category to link, fall through to next source.
   - **Last statement**  -  most recent row in `statements/{last4}/` or closing balance from last `runs/{period}/run.json` that included this account.
   - **User paste**  -  ask one targeted question.

   Sum to `currentCash`. Record per-account source + timestamp so report auditable.

3. **Compute trailing net burn.** Read last 6 months P&Ls from `financials/{YYYY-MM}/pnl.md` (or recompute on fly from `journal-entries.json` if month missing):
   - **Net burn** = negative of Net Income, exclude one-time items flagged in `journal-entries.json` by `type in {"adjustment"}` and memo containing `"one-time"` / `"true-up"`. If cash-flow statement exists for period, prefer its operating + investing cash flow as burn measure.
   - **Trailing 3-month**  -  average of last 3 months.
   - **Trailing 6-month**  -  average of last 6 months.
   Record both; report show both so user see smoothing difference.

4. **Build 12-month cash history.** For each of last 12 month-ends, compute total cash (sum of cash GL balances at that date from `journal-entries.json` + opening balance). Runway chart data: `cashHistory[]` = `[{monthEnd, totalCash}]`.

5. **Compute runway.**
   - `runway_3mo = currentCash / trailing_3mo_net_burn`
   - `runway_6mo = currentCash / trailing_6mo_net_burn`
   Net burn zero or negative (profitable) → display "infinite" for that column and annotate. Show both so user see sensitivity to smoothing window.

6. **Build sensitivity table.** At each of `-20%`, `-10%`, `0%`, `+10%`, `+20%` of current burn, compute runway using trailing 3-month base. Columns: `burn_change_pct`, `implied_monthly_burn`, `runway_months`.

7. **Identify top-3 cost drivers.** From latest P&L breakdown, group expense lines by `statementSection` (e.g., `operating-expenses.headcount`, `operating-expenses.hosting`, `operating-expenses.marketing`) and pick three largest by absolute dollar for trailing month. Cite each to specific P&L file path + JE ids if user want to drill in.

8. **Flag week-over-week runway change.** Read prior `runway/*.md` (most recent by filename date). Runway moved >10% vs prior report → prepend prominent flag to new report with delta + likely cause (burn change vs cash balance change).

9. **Write report.** Path: `runway/{YYYY-MM-DD}.md` (today date). Atomic write: `.tmp` → rename. Structure:
   - **Headline**  -  1-2 sentences: `$X cash, $Y/mo burn (3mo), {runway} months runway`.
   - **Cash balances**  -  per-account table with balance + source + asOf.
   - **Net burn**  -  3mo and 6mo trailing, one-time items excluded (list them).
   - **Runway**  -  both views (3mo and 6mo).
   - **Cash history (12mo)**  -  `cashHistory[]` in table; downstream UI can chart it.
   - **Sensitivity table**  -  five rows ±20%.
   - **Top-3 cost drivers**  -  each with dollar, % of opex, source citation.
   - **Week-over-week change**  -  if applicable, flagged delta.
   - Footer: sources (P&L paths, context-ledger path, bank balance sources + timestamps).

10. **Append to `outputs.json`.** Read-merge-write. Row:
    `{id, type: "burn-runway", title: "Burn & Runway  -
    {YYYY-MM-DD}", summary: "<the headline>", path:
    "runway/{YYYY-MM-DD}.md", status: "draft", domain:
    "reporting"}`.

11. **Summarize to user.** One paragraph: cash, burn (both trailing windows), runway (both), biggest cost driver, any week-over-week flag. Point at written file. Never give "advice" on cuts  -  surface math, let founder decide.

## Outputs

- `runway/{YYYY-MM-DD}.md`
- `outputs.json` row: `type: "burn-runway"`, `domain: "reporting"`, `status: "draft"` until user signs off.