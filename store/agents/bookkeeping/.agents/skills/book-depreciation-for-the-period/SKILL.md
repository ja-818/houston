---
name: book-depreciation-for-the-period
description: "Reads the fixed-asset schedule, computes straight-line monthly depreciation per asset, and drafts the period JE. Sum grouped by asset class."
version: 1
tags: ["bookkeeping", "overview-action", "prep-journal-entry"]
category: "Close"
featured: yes
integrations: ["quickbooks", "xero", "linear"]
image: "ledger"
inputs:
  - name: period
    label: "Period"
    placeholder: "e.g. 2026-03"
prompt_template: |
  Book depreciation. Use the prep-journal-entry skill with type=depreciation. Read the fixed-asset schedule from config/fixed-assets.json (prompt once if absent  -  needs asset, acquisition date, cost, useful life, method). Compute straight-line monthly depreciation per asset for the period, sum by asset class, and draft one JE: debit Depreciation Expense by class, credit Accumulated Depreciation by class. Save to journal-entries/{{period}}/depreciation.md.
---


# Book depreciation for the period
**Use when:** Fixed-asset schedule + monthly depreciation JE.
**What it does:** Reads the fixed-asset schedule, computes straight-line monthly depreciation per asset, and drafts the period JE. Sum grouped by asset class.
**Outcome:** JE at journal-entries/{YYYY-MM}/depreciation.md.
## Instructions
Run this as a user-facing action. Use the underlying `prep-journal-entry` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Book depreciation. Use the prep-journal-entry skill with type=depreciation. Read the fixed-asset schedule from config/fixed-assets.json (prompt once if absent  -  needs asset, acquisition date, cost, useful life, method). Compute straight-line monthly depreciation per asset for the period, sum by asset class, and draft one JE: debit Depreciation Expense by class, credit Accumulated Depreciation by class. Save to journal-entries/{YYYY-MM}/depreciation.md.
```
