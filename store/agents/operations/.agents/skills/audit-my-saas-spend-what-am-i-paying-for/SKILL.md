---
name: audit-my-saas-spend-what-am-i-paying-for
description: "I aggregate subscriptions from your contracts folder, Stripe, and inbox receipts. Flag duplicates, unused tools, and rank top cancel candidates by annual cost × low-usage signal."
version: 1
tags: ["operations", "overview-action", "audit-saas-spend"]
category: "Finance"
featured: yes
integrations: ["gmail", "outlook", "stripe"]
image: "clipboard"
---


# Audit my SaaS spend  -  what am I paying for?
**Use when:** Stripe + contracts + inbox receipts. Cancel candidates.
**What it does:** I aggregate subscriptions from your contracts folder, Stripe, and inbox receipts. Flag duplicates, unused tools, and rank top cancel candidates by annual cost × low-usage signal.
**Outcome:** Audit at saas-audits/{date}.md with ranked cancel candidates.
## Instructions
Run this as a user-facing action. Use the underlying `audit-saas-spend` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Audit my SaaS spend. Use the audit-saas-spend skill. Aggregate subscriptions from my contracts/ folder, connected Stripe, and inbox receipts (Gmail / Outlook). Flag duplicates, unused tools, and rank the top cancel candidates by annual cost × low-usage signal. Save to saas-audits/{YYYY-MM-DD}.md.
```
