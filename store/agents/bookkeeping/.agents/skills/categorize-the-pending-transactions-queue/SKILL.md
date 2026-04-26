---
name: categorize-the-pending-transactions-queue
description: "I pull the pending queue, apply your rules + prior-year + reasoning, and surface ready-to-post vs. needs-review vs. suspense with counts and $ volume."
version: 1
tags: ["bookkeeping", "overview-action", "categorize-transactions"]
category: "Transactions"
featured: yes
integrations: ["stripe", "quickbooks", "xero"]
image: "ledger"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Categorize the pending transactions. Use the categorize-transactions skill. Pull the pending-transaction list from the connected QBO / Xero / provided CSV. Apply priority order: party-rules exact match → prior-categorizations fuzzy match (token-set ratio ≥ 0.85) → reasoning against the chart-of-accounts with calibrated confidence. Anything < 0.90 goes to Suspense (never invent GL codes). Write the review-ready batch to transactions/{{date}}.md with summary counts (ready / review / suspense) and $ amount in suspense.
---


# Categorize the pending-transactions queue
**Use when:** QBO / Xero / CSV queue → review-ready categorizations.
**What it does:** I pull the pending queue, apply your rules + prior-year + reasoning, and surface ready-to-post vs. needs-review vs. suspense with counts and $ volume.
**Outcome:** Review-ready batch at transactions/{date}.md with a ready/review/suspense breakdown.
## Instructions
Run this as a user-facing action. Use the underlying `categorize-transactions` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Categorize the pending transactions. Use the categorize-transactions skill. Pull the pending-transaction list from the connected QBO / Xero / provided CSV. Apply priority order: party-rules exact match → prior-categorizations fuzzy match (token-set ratio ≥ 0.85) → reasoning against the chart-of-accounts with calibrated confidence. Anything < 0.90 goes to Suspense (never invent GL codes). Write the review-ready batch to transactions/{YYYY-MM-DD}.md with summary counts (ready / review / suspense) and $ amount in suspense.
```

Preferred tool or integration hint: QuickBooks.
