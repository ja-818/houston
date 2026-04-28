---
name: cutoff-check-what-got-booked-in-the-wrong-period
description: "Catches late-arriving expenses (prior-period adjustment / accrual), early-booked items (should reverse), and unrecorded liabilities at period end."
version: 1
tags: ["bookkeeping", "overview-action", "run-monthly-close"]
category: "Close"
featured: yes
integrations: ["quickbooks", "xero"]
image: "ledger"
---


# Cutoff check  -  what got booked in the wrong period?
**Use when:** Expenses dated prior period but booked current. AP cutoff too.
**What it does:** Catches late-arriving expenses (prior-period adjustment / accrual), early-booked items (should reverse), and unrecorded liabilities at period end.
**Outcome:** Cutoff report at closes/{YYYY-MM}/cutoff-check.md.
## Instructions
Run this as a user-facing action. Use the underlying `run-monthly-close` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Run the period cutoff check. Use the run-monthly-close skill with step=cutoff-check. Scan transactions: any booked in the current period but dated ≥ 10 days before period start (late-arriving expense = prior-period adjustment or accrual candidate); any booked in prior period but dated in current (should have been accrued). Check AP-aging for unrecorded liabilities as of period end (large open bills dated in-period). Save to closes/{YYYY-MM}/cutoff-check.md.
```
