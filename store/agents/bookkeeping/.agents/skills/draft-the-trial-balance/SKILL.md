---
name: draft-the-trial-balance
description: "Full trial balance with debit/credit totals, grouped by statement section, and cross-tied to the P&L and balance sheet."
version: 1
tags: ["bookkeeping", "overview-action", "generate-financial-statements"]
category: "Reporting"
featured: yes
integrations: ["gmail", "googledocs", "googledrive", "googlesheets", "hubspot", "linear", "notion", "outlook", "quickbooks", "slack", "stripe", "xero"]
image: "ledger"
inputs:
  - name: period
    label: "Period"
    placeholder: "e.g. 2026-03"
prompt_template: |
  Draft the trial balance. Use the generate-financial-statements skill with statement=trial-balance. Every GL account's ending balance as of the specified date. Total debits must equal total credits  -  any out-of-balance is flagged. Group by statement section (balance-sheet assets / liabilities / equity, P&L revenue / COGS / opex). Cross-tie to the P&L and balance sheet. Save to financials/{{period}}/trial-balance.md.
---


# Draft the trial balance
**Use when:** Every GL account's ending balance, tied out to statements.
**What it does:** Full trial balance with debit/credit totals, grouped by statement section, and cross-tied to the P&L and balance sheet.
**Outcome:** Trial balance at financials/{YYYY-MM}/trial-balance.md.
## Instructions
Run this as a user-facing action. Use the underlying `generate-financial-statements` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft the trial balance. Use the generate-financial-statements skill with statement=trial-balance. Every GL account's ending balance as of the specified date. Total debits must equal total credits  -  any out-of-balance is flagged. Group by statement section (balance-sheet assets / liabilities / equity, P&L revenue / COGS / opex). Cross-tie to the P&L and balance sheet. Save to financials/{YYYY-MM}/trial-balance.md.
```
