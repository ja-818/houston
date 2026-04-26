---
name: draft-a-standard-journal-entry
description: "Balanced double-entry JE against your locked CoA, with memo, reversing flag, and supporting-doc links. Never posts - you review and post to QBO / Xero."
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
  - name: slug
    label: "Slug"
    required: false
prompt_template: |
  Draft the journal entry. Use the prep-journal-entry skill, picking `type` from: accrual | prepaid | payroll | revrec | depreciation | stock-comp | adjustment | reclass. Build a balanced double-entry JE against the locked chart-of-accounts, with a clear memo and supporting-doc links. Set reversing=true and reversesEntryId when the entry reverses a prior accrual. Save to journal-entries/{{period}}/{{slug}}.md and append to journal-entries.json with status=draft.
---


# Draft a standard journal entry
**Use when:** Accruals, prepaids, payroll, revrec, depreciation, stock comp.
**What it does:** Balanced double-entry JE against your locked CoA, with memo, reversing flag, and supporting-doc links. Never posts  -  you review and post to QBO / Xero.
**Outcome:** JE at journal-entries/{YYYY-MM}/{slug}.md + row in journal-entries.json.
## Instructions
Run this as a user-facing action. Use the underlying `prep-journal-entry` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft the journal entry. Use the prep-journal-entry skill, picking `type` from: accrual | prepaid | payroll | revrec | depreciation | stock-comp | adjustment | reclass. Build a balanced double-entry JE against the locked chart-of-accounts, with a clear memo and supporting-doc links. Set reversing=true and reversesEntryId when the entry reverses a prior accrual. Save to journal-entries/{YYYY-MM}/{slug}.md and append to journal-entries.json with status=draft.
```
