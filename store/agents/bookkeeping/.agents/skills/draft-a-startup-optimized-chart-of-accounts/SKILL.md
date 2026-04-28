---
name: draft-a-startup-optimized-chart-of-accounts
description: "Startup-optimized CoA with R&D / S&M / G&A opex breakouts, deferred revenue, accrued PTO, and SAFE-note equity lines. Written to config/chart-of-accounts.json."
version: 1
tags: ["bookkeeping", "overview-action", "build-chart-of-accounts"]
category: "Setup"
featured: yes
integrations: ["hubspot", "stripe", "quickbooks", "xero", "notion", "slack"]
image: "ledger"
---


# Draft a startup-optimized chart of accounts
**Use when:** R&D / G&A / S&M breakouts, deferred revenue, accrued PTO, SAFE lines.
**What it does:** Startup-optimized CoA with R&D / S&M / G&A opex breakouts, deferred revenue, accrued PTO, and SAFE-note equity lines. Written to config/chart-of-accounts.json.
**Outcome:** Locked CoA at config/chart-of-accounts.json. Used by every categorization run.
## Instructions
Run this as a user-facing action. Use the underlying `build-chart-of-accounts` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft our chart of accounts. Use the build-chart-of-accounts skill. Produce a startup-optimized CoA with income (recurring vs. one-time), COGS (hosting, third-party fees), opex broken into R&D / S&M / G&A, assets (cash by account, prepaid rent, prepaid SaaS, fixed assets), liabilities (deferred revenue, accrued payroll, accrued PTO, SAFE notes, convertible notes), and equity. Write to config/chart-of-accounts.json with `[{code, name, type, statementSection}]`.
```
