---
name: generate-the-cash-flow-statement
description: "Indirect method cash flow statement with operating / investing / financing sections. Reconciles to cash GL balances - any gap is flagged."
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
  Generate the cash flow statement. Use the generate-financial-statements skill with statement=cash-flow. Indirect method: start from net income, adjust for non-cash items (depreciation, SBC, deferred revenue movement, accrual changes), separate into operating / investing / financing. Ending cash must reconcile to the sum of cash GL balances from the balance sheet  -  flag any reconciliation gap. Save to financials/{{period}}/cash-flow.md.
---


# Generate the cash flow statement
**Use when:** Operating / investing / financing. Indirect method, reconciles to cash.
**What it does:** Indirect method cash flow statement with operating / investing / financing sections. Reconciles to cash GL balances  -  any gap is flagged.
**Outcome:** Cash flow at financials/{YYYY-MM}/cash-flow.md.
## Instructions
Run this as a user-facing action. Use the underlying `generate-financial-statements` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Generate the cash flow statement. Use the generate-financial-statements skill with statement=cash-flow. Indirect method: start from net income, adjust for non-cash items (depreciation, SBC, deferred revenue movement, accrual changes), separate into operating / investing / financing. Ending cash must reconcile to the sum of cash GL balances from the balance sheet  -  flag any reconciliation gap. Save to financials/{YYYY-MM}/cash-flow.md.
```
