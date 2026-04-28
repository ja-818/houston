---
name: book-the-payroll-je-from-the-provider
description: "Pay-period summary → balanced JE with wages classified by department (R&D / S&M / G&A), payroll taxes separated, benefits accrued."
version: 1
tags: ["bookkeeping", "overview-action", "prep-journal-entry"]
category: "Close"
featured: yes
integrations: ["quickbooks", "xero", "linear"]
image: "ledger"
---


# Book the payroll JE from the provider
**Use when:** Gusto / Rippling / Justworks payroll run → balanced JE.
**What it does:** Pay-period summary → balanced JE with wages classified by department (R&D / S&M / G&A), payroll taxes separated, benefits accrued.
**Outcome:** JE at journal-entries/{YYYY-MM}/payroll-{end}.md.
## Instructions
Run this as a user-facing action. Use the underlying `prep-journal-entry` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Book the payroll journal entry. Use the prep-journal-entry skill with type=payroll. Pull the pay-period summary from the connected Gusto / Rippling / Justworks (or accept a pasted summary). Classify gross wages by department (R&D / S&M / G&A) based on context-ledger.domains.payroll.teamSize or a team-to-department map if present. Book: debit by-department wage expense, debit by-department payroll-tax expense, credit cash (or accrued payroll if post-period), credit benefits-liability lines. Save to journal-entries/{YYYY-MM}/payroll-{pay-period-end}.md.
```

Preferred tool or integration hint: Gusto.
