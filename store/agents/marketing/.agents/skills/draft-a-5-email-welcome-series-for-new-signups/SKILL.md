---
name: draft-a-5-email-welcome-series-for-new-signups
description: "Day 0 / 1 / 3 / 7 / 14 sequence (override any cadence). Each email: subject, preview, body, CTA, success metric. Formatted for your connected ESP."
version: 1
tags: ["marketing", "overview-action", "plan-campaign"]
category: "Email"
featured: yes
integrations: ["hubspot", "stripe", "linkedin", "mailchimp", "customerio", "googleads", "metaads"]
image: "megaphone"
---


# Draft a 5-email welcome series for new signups
**Use when:** Day 0 / 1 / 3 / 7 / 14  -  subject, body, CTA, metric.
**What it does:** Day 0 / 1 / 3 / 7 / 14 sequence (override any cadence). Each email: subject, preview, body, CTA, success metric. Formatted for your connected ESP.
**Outcome:** Full sequence at campaigns/welcome-{variant}.md. Drop into your platform.
## Instructions
Run this as a user-facing action. Use the underlying `plan-campaign` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft a 5-email welcome series for new signups. Use the plan-campaign skill with type=welcome. Day 0 / 1 / 3 / 7 / 14 default (override any cadence). Each email: subject, preview, body, CTA, success metric. Formatted for my connected ESP (Customer.io / Loops / Mailchimp / Kit  -  via Composio). Save to campaigns/welcome-{variant}.md.
```
