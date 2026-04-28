---
name: full-customer-timeline-story-of-the-relationship
description: "Every interaction (tickets, calls, purchases, plan changes, NPS) from `conversations.json` + Stripe + your CRM, sorted chronologically."
version: 1
tags: ["support", "overview-action", "customer-view"]
category: "Inbox"
featured: yes
integrations: ["gmail", "hubspot", "salesforce", "attio", "stripe"]
image: "headphone"
---


# Full customer timeline  -  story of the relationship
**Use when:** Every ticket, call, plan change, NPS  -  chronologically.
**What it does:** Every interaction (tickets, calls, purchases, plan changes, NPS) from `conversations.json` + Stripe + your CRM, sorted chronologically.
**Outcome:** Timeline at `timelines/{slug}.md`  -  the foundation for QBRs and renewals.
## Instructions
Run this as a user-facing action. Use the underlying `customer-view` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Show me the full timeline for {account}. Use the customer-view skill with view=timeline. Pull every interaction (tickets, calls, purchases, plan changes, NPS) from conversations.json + my connected Stripe + my connected CRM and sort chronologically. Save to timelines/{slug}.md.
```
