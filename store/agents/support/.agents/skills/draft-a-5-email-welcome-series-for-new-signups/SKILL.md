---
name: draft-a-5-email-welcome-series-for-new-signups
description: "Day 0 / 1 / 3 / 7 / 14 sequence keyed to your activation milestones. Each touch: subject, preview, body, CTA, success metric. Formatted for your connected ESP (Customer.io / Loops / Mailchimp / Kit)."
version: 1
tags: ["support", "overview-action", "draft-lifecycle-message"]
category: "Success"
featured: yes
integrations: ["hubspot", "attio", "stripe", "mailchimp", "customerio", "loops"]
image: "headphone"
---


# Draft a 5-email welcome series for new signups
**Use when:** Day 0 / 1 / 3 / 7 / 14  -  subject, body, CTA, metric.
**What it does:** Day 0 / 1 / 3 / 7 / 14 sequence keyed to your activation milestones. Each touch: subject, preview, body, CTA, success metric. Formatted for your connected ESP (Customer.io / Loops / Mailchimp / Kit).
**Outcome:** Full sequence at `onboarding/{segment}.md`  -  drop into your ESP.
## Instructions
Run this as a user-facing action. Use the underlying `draft-lifecycle-message` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft a welcome series for {segment}. Use the draft-lifecycle-message skill with type=welcome-series. 5 touches (Day 0 / 1 / 3 / 7 / 14) keyed to the product's activation milestones in domains.email.journey (ask if not set). Each touch: subject, preview, body, CTA, success metric. Format for my connected ESP (Customer.io / Loops / Mailchimp / Kit via Composio). Save to onboarding/{segment}.md.
```
