---
name: analyze-variance-vs-budget-prior-period
description: "Material variances decomposed into price / volume / mix / one-time drivers, with a plain-English narrative on the 3-5 biggest movers."
version: 1
tags: ["bookkeeping", "overview-action", "run-variance-analysis"]
category: "Reporting"
featured: yes
integrations: ["gmail", "googledocs", "googledrive", "googlesheets", "hubspot", "linear", "notion", "outlook", "quickbooks", "slack", "stripe", "xero"]
image: "ledger"
inputs:
  - name: period
    label: "Period"
    placeholder: "e.g. 2026-03"
prompt_template: |
  Run variance analysis. Use the run-variance-analysis skill. Compare actuals for the period against (a) budget from config/budget.json if present, (b) prior period, (c) same period prior year. Decompose each material variance into drivers (price / volume / mix / one-time) grounded in transactions + journal-entries.json. Produce a plain-English narrative calling out the 3-5 biggest movers. Save to variance-analyses/{{period}}.md.
---


# Analyze variance vs. budget / prior period
**Use when:** Decomposed drivers (price / volume / mix) + narrative.
**What it does:** Material variances decomposed into price / volume / mix / one-time drivers, with a plain-English narrative on the 3-5 biggest movers.
**Outcome:** Analysis at variance-analyses/{YYYY-MM}.md.
## Instructions
Run this as a user-facing action. Use the underlying `run-variance-analysis` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Run variance analysis. Use the run-variance-analysis skill. Compare actuals for the period against (a) budget from config/budget.json if present, (b) prior period, (c) same period prior year. Decompose each material variance into drivers (price / volume / mix / one-time) grounded in transactions + journal-entries.json. Produce a plain-English narrative calling out the 3-5 biggest movers. Save to variance-analyses/{YYYY-MM}.md.
```
