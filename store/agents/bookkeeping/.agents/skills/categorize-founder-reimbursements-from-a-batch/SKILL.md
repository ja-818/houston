---
name: categorize-founder-reimbursements-from-a-batch
description: "Batch of receipts → one expense record per receipt + a single summary JE crediting Founder Loan Payable or Accrued Reimbursements."
version: 1
tags: ["bookkeeping", "overview-action", "handle-expense-receipt"]
category: "Transactions"
featured: yes
integrations: ["gmail", "outlook", "quickbooks", "xero"]
image: "ledger"
---


# Categorize founder reimbursements from a batch
**Use when:** Monthly reimbursement batch → categorized expense + JE per item.
**What it does:** Batch of receipts → one expense record per receipt + a single summary JE crediting Founder Loan Payable or Accrued Reimbursements.
**Outcome:** Expense records at expenses/ + summary JE at journal-entries/{YYYY-MM}/founder-reimbursement-{date}.md.
## Instructions
Run this as a user-facing action. Use the underlying `handle-expense-receipt` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Process the founder-reimbursement batch. Use the handle-expense-receipt skill in BATCH sub-mode. For each attached receipt or line item: extract vendor + date + amount, categorize against the locked CoA (confidence ≥ 0.90  -  Suspense otherwise), draft one line per expense. At the end, draft a single credit JE: debit each expense line, credit Founder Loan Payable (or Accrued Reimbursements if same-period reimbursement). Save individual expense records to expenses/ and the summary JE to journal-entries/{YYYY-MM}/founder-reimbursement-{YYYY-MM-DD}.md.
```
