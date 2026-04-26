---
name: are-the-books-clean-books-in-shape-audit
description: "Sweeps uncategorized aging, recon breaks, stale accruals, cutoff issues, and draft JEs. Ranked by dollar impact with the one move called out."
version: 1
tags: ["bookkeeping", "overview-action", "audit-books"]
category: "Reporting"
featured: yes
integrations: ["gmail", "googledocs", "googledrive", "googlesheets", "hubspot", "linear", "notion", "outlook", "quickbooks", "slack", "stripe", "xero"]
image: "ledger"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Run a books health audit. Use the audit-books skill. Sweep: uncategorized / suspense items with aging, recon breaks > $100 open > 30 days, accruals with no activity > 90 days, cutoff candidates (expenses dated in prior period booked in current), JEs in draft for > 14 days, and any GL code with transactions but no opening balance. Produce a punch list at audits/{{date}}.md ranked by dollar impact. Call out the one most useful item to close this week.
---


# Are the books clean? (Books-in-shape audit)
**Use when:** Uncategorized aging, recon breaks, stale accruals, cutoff issues.
**What it does:** Sweeps uncategorized aging, recon breaks, stale accruals, cutoff issues, and draft JEs. Ranked by dollar impact with the one move called out.
**Outcome:** Punch list at audits/{date}.md.
## Instructions
Run this as a user-facing action. Use the underlying `audit-books` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Run a books health audit. Use the audit-books skill. Sweep: uncategorized / suspense items with aging, recon breaks > $100 open > 30 days, accruals with no activity > 90 days, cutoff candidates (expenses dated in prior period booked in current), JEs in draft for > 14 days, and any GL code with transactions but no opening balance. Produce a punch list at audits/{YYYY-MM-DD}.md ranked by dollar impact. Call out the one most useful item to close this week.
```
