---
name: turn-a-receipt-into-a-categorized-expense
description: "For founder reimbursements or one-offs outside the bank-feed pipeline: receipt → GL assignment + balanced JE."
version: 1
tags: ["bookkeeping", "overview-action", "handle-expense-receipt"]
category: "Transactions"
featured: yes
integrations: ["gmail", "outlook", "quickbooks", "xero"]
image: "ledger"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
  - name: slug
    label: "Slug"
    required: false
prompt_template: |
  Categorize this expense receipt. Use the handle-expense-receipt skill. Read the receipt (PDF / image / email forward), extract vendor + date + amount + line items, pick the best GL code from the locked chart-of-accounts (confidence ≥ 0.90 required  -  Suspense otherwise), and draft a balanced journal entry. Write the expense record to expenses/{{date}}-{{slug}}.md with the JE inline.
---


# Turn a receipt into a categorized expense
**Use when:** One receipt → GL line + balanced JE in your voice.
**What it does:** For founder reimbursements or one-offs outside the bank-feed pipeline: receipt → GL assignment + balanced JE.
**Outcome:** Record at expenses/{date}-{slug}.md with a ready-to-post JE.
## Instructions
Run this as a user-facing action. Use the underlying `handle-expense-receipt` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Categorize this expense receipt. Use the handle-expense-receipt skill. Read the receipt (PDF / image / email forward), extract vendor + date + amount + line items, pick the best GL code from the locked chart-of-accounts (confidence ≥ 0.90 required  -  Suspense otherwise), and draft a balanced journal entry. Write the expense record to expenses/{YYYY-MM-DD}-{slug}.md with the JE inline.
```
