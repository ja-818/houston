---
name: churn-risk-scan-on-a-specific-account
description: "I scan the last 60 days of conversations for cancellation language, frustration signals, or a usage cliff - then write a flag with severity + a recommended next move."
version: 1
tags: ["support", "overview-action", "customer-view"]
category: "Inbox"
featured: yes
integrations: ["gmail", "hubspot", "salesforce", "attio", "stripe"]
image: "headphone"
---


# Churn risk scan on a specific account
**Use when:** Cancellation language, usage cliff  -  signal + severity.
**What it does:** I scan the last 60 days of conversations for cancellation language, frustration signals, or a usage cliff  -  then write a flag with severity + a recommended next move.
**Outcome:** Flag in `churn-flags.json`  -  feed it to `draft-lifecycle-message type=churn-save`.
## Instructions
Run this as a user-facing action. Use the underlying `customer-view` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Run a churn risk scan on {account}. Use the customer-view skill with view=churn-risk. Scan the last 60 days of conversations for cancellation language, 2+ frustration signals, or a usage cliff. If found, write a new entry to churn-flags.json with signal + severity + recommended next move.
```
