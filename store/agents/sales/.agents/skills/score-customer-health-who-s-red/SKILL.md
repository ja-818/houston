---
name: score-customer-health-who-s-red
description: "Every current customer scored on usage trend · NPS · support tickets · billing signal (via PostHog + Stripe). Top 2 drivers named per row - no magic numbers."
version: 1
tags: ["sales", "overview-action", "score"]
category: "Retention"
featured: yes
integrations: ["hubspot", "salesforce", "attio", "stripe"]
image: "handshake"
---


# Score customer health  -  who's red?
**Use when:** Usage · NPS · support · billing. Top 2 drivers.
**What it does:** Every current customer scored on usage trend · NPS · support tickets · billing signal (via PostHog + Stripe). Top 2 drivers named per row  -  no magic numbers.
**Outcome:** Scored customers at scores/customer-health-{date}.md.
## Instructions
Run this as a user-facing action. Use the underlying `score` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Score customer health. Use the score skill with subject=customer-health. Pull every current customer from customers.json + connected CRM. Compute drivers: usage trend via connected PostHog / Mixpanel / Amplitude, NPS / CSAT if captured, support-ticket volume, billing signal via Stripe. Apply the health thresholds. Name the top 2 drivers per row. Save to scores/customer-health-{YYYY-MM-DD}.md.
```
