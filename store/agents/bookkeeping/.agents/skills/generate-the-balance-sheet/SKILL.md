---
name: generate-the-balance-sheet
description: "Classified balance sheet with PoP, opening-balance tie-out, and flags on any counterintuitive balances (credit AR, debit AP, etc.)."
version: 1
tags: ["bookkeeping", "overview-action", "generate-financial-statements"]
category: "Reporting"
featured: yes
integrations: ["gmail", "googledocs", "googledrive", "googlesheets", "hubspot", "linear", "notion", "outlook", "quickbooks", "slack", "stripe", "xero"]
image: "ledger"
---


# Generate the balance sheet
**Use when:** Assets / liabilities / equity with PoP and opening-balance tie.
**What it does:** Classified balance sheet with PoP, opening-balance tie-out, and flags on any counterintuitive balances (credit AR, debit AP, etc.).
**Outcome:** Balance sheet at financials/{YYYY-MM}/balance-sheet.md.
## Instructions
Run this as a user-facing action. Use the underlying `generate-financial-statements` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Generate the balance sheet. Use the generate-financial-statements skill with statement=balance-sheet. As-of the specified date, grouped into current / non-current for assets and liabilities, with PoP comparison (vs. prior month-end and prior year-end). Tie the equity section back to opening balances + YTD net income. Flag any account where the balance would be unusual (e.g., credit AR balance, debit AP balance). Save to financials/{YYYY-MM}/balance-sheet.md.
```
