---
name: backfill-from-quickbooks-xero-prior-spreadsheet
description: "I parse your QBO / Xero export or prior spreadsheet, seed the CoA, opening balances, and prior-year vendor → GL assignments - so every future run inherits your history."
version: 1
tags: ["bookkeeping", "overview-action", "import-historical-books"]
category: "Setup"
featured: yes
integrations: ["quickbooks", "xero"]
image: "ledger"
---


# Backfill from QuickBooks / Xero / prior spreadsheet
**Use when:** Transactions + opening balances + prior categorizations seeded.
**What it does:** I parse your QBO / Xero export or prior spreadsheet, seed the CoA, opening balances, and prior-year vendor → GL assignments  -  so every future run inherits your history.
**Outcome:** Seeded CoA + opening trial balance + prior categorizations ready for future runs.
## Instructions
Run this as a user-facing action. Use the underlying `import-historical-books` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Import our historical books. Use the import-historical-books skill. Parse the provided QBO / Xero export or prior-period workbook. Extract: chart of accounts (seed config/chart-of-accounts.json if absent), opening trial balance (write config/opening-trial-balance.json), transaction history by account, and prior vendor categorizations (seed config/prior-categorizations.json with majority GL per vendor where ≥ 80% consistent).
```

Preferred tool or integration hint: QuickBooks.
