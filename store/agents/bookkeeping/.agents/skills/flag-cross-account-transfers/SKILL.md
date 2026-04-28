---
name: flag-cross-account-transfers
description: "Detects debit/credit pairs across accounts (e.g., Chase → Mercury), tags them GL 9000 Internal Transfer, and excludes them from P&L so they don't distort revenue or expense."
version: 1
tags: ["bookkeeping", "overview-action", "reconcile-account"]
category: "Transactions"
featured: yes
integrations: ["stripe", "quickbooks", "xero"]
image: "ledger"
---


# Flag cross-account transfers
**Use when:** Detect dupes between accounts  -  tag GL 9000, exclude from P&L.
**What it does:** Detects debit/credit pairs across accounts (e.g., Chase → Mercury), tags them GL 9000 Internal Transfer, and excludes them from P&L so they don't distort revenue or expense.
**Outcome:** Pair list at reconciliations/transfers/{period}.md. GL 9000 tags applied.
## Instructions
Run this as a user-facing action. Use the underlying `reconcile-account` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Find cross-account transfers. Use the reconcile-account skill with mode=transfer-detect. For every debit in account A on date D, search all other accounts for a credit on date D±2 with the same absolute amount. Matching legs get gl_code=9000 (Internal Transfer), source=transfer, category_status=ready_for_approval. Write the transfer-pair list to reconciliations/transfers/{period}.md. Transfers are excluded from P&L SUMIFS formulas so they don't inflate revenue/expense.
```
