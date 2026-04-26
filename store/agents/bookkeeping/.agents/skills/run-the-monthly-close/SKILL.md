---
name: run-the-monthly-close
description: "I orchestrate reconcile → accruals → JEs → statements → variance and produce the full close package in one pass. Open items (breaks, uncategorized, stale accruals) flagged at the top."
version: 1
tags: ["bookkeeping", "overview-action", "run-monthly-close"]
category: "Close"
featured: yes
integrations: ["quickbooks", "xero"]
image: "ledger"
inputs:
  - name: period
    label: "Period"
    placeholder: "e.g. 2026-03"
prompt_template: |
  Close the books for the specified month. Use the run-monthly-close skill. Orchestrate: (1) reconcile-account across every account in context-ledger.banks for the period, (2) review-accruals to refresh the register, (3) prep-journal-entry for every due JE (accruals, prepaids, depreciation, revrec, payroll, stock comp), (4) generate-financial-statements with statement=pnl / balance-sheet / cash-flow, (5) run-variance-analysis against budget or prior period. Assemble the close package at closes/{{period}}/package.md with links to every sub-artifact. Flag open items (recon breaks > $100, uncategorized > 10% of volume, stale accruals > 90d).
---


# Run the monthly close
**Use when:** Reconcile → accruals → JEs → statements → variance → package.
**What it does:** I orchestrate reconcile → accruals → JEs → statements → variance and produce the full close package in one pass. Open items (breaks, uncategorized, stale accruals) flagged at the top.
**Outcome:** Close package at closes/{YYYY-MM}/package.md with links to every sub-artifact.
## Instructions
Run this as a user-facing action. Use the underlying `run-monthly-close` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Close the books for the specified month. Use the run-monthly-close skill. Orchestrate: (1) reconcile-account across every account in context-ledger.banks for the period, (2) review-accruals to refresh the register, (3) prep-journal-entry for every due JE (accruals, prepaids, depreciation, revrec, payroll, stock comp), (4) generate-financial-statements with statement=pnl / balance-sheet / cash-flow, (5) run-variance-analysis against budget or prior period. Assemble the close package at closes/{YYYY-MM}/package.md with links to every sub-artifact. Flag open items (recon breaks > $100, uncategorized > 10% of volume, stale accruals > 90d).
```
