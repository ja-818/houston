---
name: score-account-health-green-yellow-red
description: "3 signals (ticket volume, product-usage trend via PostHog, sentiment) against your churn thresholds. GREEN / YELLOW / RED + reasoning + ONE action - never a wall of metrics."
version: 1
tags: ["support", "overview-action", "customer-view"]
category: "Inbox"
featured: yes
integrations: ["gmail", "hubspot", "salesforce", "attio", "stripe"]
image: "headphone"
---


# Score account health  -  GREEN / YELLOW / RED
**Use when:** 3 signals + reasoning + one recommended action.
**What it does:** 3 signals (ticket volume, product-usage trend via PostHog, sentiment) against your churn thresholds. GREEN / YELLOW / RED + reasoning + ONE action  -  never a wall of metrics.
**Outcome:** Score in `health-scores.json`  -  grounds your next `draft-lifecycle-message`.
## Instructions
Run this as a user-facing action. Use the underlying `customer-view` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Score account health for {account}. Use the customer-view skill with view=health. Compute 3 signals (ticket volume, product-usage trend via connected PostHog, recent-interaction sentiment), apply the thresholds in domains.success.churnSignals, and output GREEN / YELLOW / RED with reasoning and ONE recommended action. Append to health-scores.json.
```
