---
name: what-s-our-burn-and-runway
description: "Net burn (3-mo and 6-mo trailing), cash balance by account, runway months, and sensitivity to the top-3 cost drivers. The founder metric."
version: 1
tags: ["bookkeeping", "overview-action", "build-burn-runway-report"]
category: "Reporting"
featured: yes
integrations: ["quickbooks", "xero"]
image: "ledger"
---


# What's our burn and runway?
**Use when:** 3-mo / 6-mo trailing net burn, runway months, sensitivity.
**What it does:** Net burn (3-mo and 6-mo trailing), cash balance by account, runway months, and sensitivity to the top-3 cost drivers. The founder metric.
**Outcome:** Report at runway/{date}.md with runway months called out prominently.
## Instructions
Run this as a user-facing action. Use the underlying `build-burn-runway-report` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Refresh the burn & runway report. Use the build-burn-runway-report skill. Read the latest cash balances across every account in context-ledger.banks. Compute trailing 3-month and 6-month net burn from financials/ or from the underlying transactions. Calculate runway months on both bases. Produce a sensitivity table: runway at -20% / -10% / 0% / +10% / +20% of current burn. Flag any 10%+ week-over-week change in runway. Save to runway/{YYYY-MM-DD}.md.
```
