---
name: generate-the-p-and-l-with-period-over-period-comparison
description: "P&L with cash + accrual views, month-over-month and year-over-year comparisons, and auto-generated notes on the biggest variance drivers."
version: 1
tags: ["bookkeeping", "overview-action", "generate-financial-statements"]
category: "Reporting"
featured: yes
integrations: ["gmail", "googledocs", "googledrive", "googlesheets", "hubspot", "linear", "notion", "outlook", "quickbooks", "slack", "stripe", "xero"]
image: "ledger"
inputs:
  - name: period
    label: "Period"
    placeholder: "e.g. 2026-03"
prompt_template: |
  Generate the P&L for the specified period. Use the generate-financial-statements skill with statement=pnl. Both cash and accrual views if accounting method is accrual (else cash only). Include PoP comparison (MoM and vs-same-month-last-year) and auto-generate 3-5 notes on the biggest variance drivers grounded in journal-entries.json + transactions. Save to financials/{{period}}/pnl.md.
---


# Generate the P&L with period-over-period comparison
**Use when:** Cash + accrual views, PoP, notes on variance drivers.
**What it does:** P&L with cash + accrual views, month-over-month and year-over-year comparisons, and auto-generated notes on the biggest variance drivers.
**Outcome:** P&L at financials/{YYYY-MM}/pnl.md.
## Instructions
Run this as a user-facing action. Use the underlying `generate-financial-statements` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Generate the P&L for the specified period. Use the generate-financial-statements skill with statement=pnl. Both cash and accrual views if accounting method is accrual (else cash only). Include PoP comparison (MoM and vs-same-month-last-year) and auto-generate 3-5 notes on the biggest variance drivers grounded in journal-entries.json + transactions. Save to financials/{YYYY-MM}/pnl.md.
```
