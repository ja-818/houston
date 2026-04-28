---
name: refresh-the-accruals-register
description: "Living register of every active accrual with balances, reversing candidates, and stale flags. Rewritten on each run."
version: 1
tags: ["bookkeeping", "overview-action", "review-accruals"]
category: "Close"
featured: yes
integrations: ["gmail", "googledocs", "googledrive", "googlesheets", "hubspot", "linear", "notion", "outlook", "quickbooks", "slack", "stripe", "xero"]
image: "ledger"
---


# Refresh the accruals register
**Use when:** Prepaid rent, deferred revenue, vacation, SaaS prepayments.
**What it does:** Living register of every active accrual with balances, reversing candidates, and stale flags. Rewritten on each run.
**Outcome:** Register at accruals/register.md + refreshed accruals.json.
## Instructions
Run this as a user-facing action. Use the underlying `review-accruals` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Refresh the accruals register. Use the review-accruals skill. Read accruals.json, compute current balances for every active accrual (prepaid rent, prepaid SaaS, deferred revenue, vacation / PTO accrual, payroll accrual), flag candidates for reversing entries this period, and call out accruals with no activity in > 90 days (stale  -  review for write-off or reclass). Rewrite accruals/register.md and upsert accruals.json.
```
