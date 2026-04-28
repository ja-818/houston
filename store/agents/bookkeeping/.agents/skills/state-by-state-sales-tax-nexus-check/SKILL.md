---
name: state-by-state-sales-tax-nexus-check
description: "Revenue + transaction-count per state, compared against each state's economic nexus threshold. Ranked by exposure with crossed-threshold dates and next actions."
version: 1
tags: ["bookkeeping", "overview-action", "assess-sales-tax-nexus"]
category: "Compliance"
featured: yes
integrations: ["stripe", "quickbooks", "xero"]
image: "ledger"
---


# State-by-state sales-tax nexus check
**Use when:** Revenue + transaction-count thresholds per state. Exposure ranked.
**What it does:** Revenue + transaction-count per state, compared against each state's economic nexus threshold. Ranked by exposure with crossed-threshold dates and next actions.
**Outcome:** Report at compliance/sales-tax/{yyyy-qn}.md.
## Instructions
Run this as a user-facing action. Use the underlying `assess-sales-tax-nexus` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Run a sales-tax nexus check. Use the assess-sales-tax-nexus skill. Aggregate revenue + transaction count per state for the period from Stripe / invoices. Compare against each state's economic nexus threshold (typically $100K revenue or 200 transactions per year, with variations). Rank states by exposure. For any state where we've crossed the threshold, surface: when it was crossed, cumulative exposure, and the next action (register / file). Save to compliance/sales-tax/{YYYY-QN}.md.
```

Preferred tool or integration hint: Stripe.
