---
name: compute-saas-metrics-arr-mrr-gross-margin-nrr
description: "MRR / ARR / GM / NRR with the standard waterfall (new / expansion / churn / contraction). From revrec schedules, not pure cash receipts."
version: 1
tags: ["bookkeeping", "overview-action", "prep-investor-financials"]
category: "Reporting"
featured: yes
integrations: ["googledocs"]
image: "ledger"
inputs:
  - name: period
    label: "Period"
    placeholder: "e.g. 2026-03"
prompt_template: |
  Refresh SaaS metrics. Use the prep-investor-financials skill with mode=saas-metrics. From active revrec schedules (revrec/) + transactions + the current close's P&L: compute MRR, ARR, new / expansion / churn / contraction MRR, gross margin (revenue − COGS / revenue), and NRR (net revenue retention over a cohort window). Write to investor-financials/metrics-{{period}}.md.
---


# Compute SaaS metrics (ARR, MRR, gross margin, NRR)
**Use when:** From contract data + revrec schedules + COGS breakout.
**What it does:** MRR / ARR / GM / NRR with the standard waterfall (new / expansion / churn / contraction). From revrec schedules, not pure cash receipts.
**Outcome:** Metrics at investor-financials/metrics-{YYYY-MM}.md.
## Instructions
Run this as a user-facing action. Use the underlying `prep-investor-financials` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Refresh SaaS metrics. Use the prep-investor-financials skill with mode=saas-metrics. From active revrec schedules (revrec/) + transactions + the current close's P&L: compute MRR, ARR, new / expansion / churn / contraction MRR, gross margin (revenue − COGS / revenue), and NRR (net revenue retention over a cohort window). Write to investor-financials/metrics-{YYYY-MM}.md.
```
