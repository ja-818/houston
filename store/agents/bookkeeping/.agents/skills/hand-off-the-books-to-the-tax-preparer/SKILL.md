---
name: hand-off-the-books-to-the-tax-preparer
description: "Complete tied-out package for your tax preparer: trial balance + recons + fixed-asset schedule + depreciation + 1099 + R&D + M-1 candidates + judgment-call notes."
version: 1
tags: ["bookkeeping", "overview-action", "hand-off-to-tax"]
category: "Compliance"
featured: yes
integrations: ["googledrive", "gmail", "outlook"]
image: "ledger"
inputs:
  - name: year
    label: "Year"
    placeholder: "e.g. 2026"
prompt_template: |
  Prep the tax-handoff package. Use the hand-off-to-tax skill. First, run audit-books  -  any open items become blockers that must be closed before handoff. Then assemble: final trial balance, every account's full-year reconciliation summary, fixed-asset schedule with depreciation, the 1099 list from track-vendor-1099s, the R&D classification from classify-rd-expenses, common M-1 adjustment candidates (meals 50%, stock comp book/tax diff, accrual-to-cash diffs for cash-basis returns), and a notes file flagging judgment calls. Save the package under handoffs/tax-{{year}}/ and optionally mirror to a shared Google Drive folder.
---


# Hand off the books to the tax preparer
**Use when:** Trial balance + recons + schedules + 1099 + R&D  -  tied-out package.
**What it does:** Complete tied-out package for your tax preparer: trial balance + recons + fixed-asset schedule + depreciation + 1099 + R&D + M-1 candidates + judgment-call notes.
**Outcome:** Package at handoffs/tax-{year}/ (+ optional Google Drive mirror).
## Instructions
Run this as a user-facing action. Use the underlying `hand-off-to-tax` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Prep the tax-handoff package. Use the hand-off-to-tax skill. First, run audit-books  -  any open items become blockers that must be closed before handoff. Then assemble: final trial balance, every account's full-year reconciliation summary, fixed-asset schedule with depreciation, the 1099 list from track-vendor-1099s, the R&D classification from classify-rd-expenses, common M-1 adjustment candidates (meals 50%, stock comp book/tax diff, accrual-to-cash diffs for cash-basis returns), and a notes file flagging judgment calls. Save the package under handoffs/tax-{year}/ and optionally mirror to a shared Google Drive folder.
```

Preferred tool or integration hint: Google Drive.
