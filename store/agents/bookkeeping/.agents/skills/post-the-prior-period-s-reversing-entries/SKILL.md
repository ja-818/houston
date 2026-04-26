---
name: post-the-prior-period-s-reversing-entries
description: "For each accrual flagged reversing=true, I draft the balanced reversal with reversesEntryId linking back. All in one pass at period open."
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
  Draft reversing entries for the current period. Use the prep-journal-entry skill with type=accrual (reversing sub-mode). Read accruals.json  -  every accrual with reversing=true that hasn't yet been reversed for this period needs a reversing JE. For each, generate a balanced JE with the opposite sign of the original, reversesEntryId linking back. Save under journal-entries/{{period}}/ and append to journal-entries.json with status=draft.
---


# Post the prior period's reversing entries
**Use when:** Auto-detect which accruals need reversing JEs this period.
**What it does:** For each accrual flagged reversing=true, I draft the balanced reversal with reversesEntryId linking back. All in one pass at period open.
**Outcome:** Reversing JEs at journal-entries/{YYYY-MM}/ + rows in journal-entries.json.
## Instructions
Run this as a user-facing action. Use the underlying `prep-journal-entry` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft reversing entries for the current period. Use the prep-journal-entry skill with type=accrual (reversing sub-mode). Read accruals.json  -  every accrual with reversing=true that hasn't yet been reversed for this period needs a reversing JE. For each, generate a balanced JE with the opposite sign of the original, reversesEntryId linking back. Save under journal-entries/{YYYY-MM}/ and append to journal-entries.json with status=draft.
```
