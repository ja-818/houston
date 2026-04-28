---
name: prep-a-qbr-pack
description: "QBR pack grounded in the success metric locked at kickoff: outcomes (with numbers) · QoQ usage trend · open asks · risks from latest health score · next-quarter goal · renewal runway."
version: 1
tags: ["sales", "overview-action", "prep-meeting"]
category: "Retention"
featured: yes
integrations: ["googlecalendar", "hubspot", "salesforce", "attio", "gong", "fireflies", "stripe", "linkedin"]
image: "handshake"
---


# Prep a QBR pack
**Use when:** Outcomes · usage · open asks · risks · next goal.
**What it does:** QBR pack grounded in the success metric locked at kickoff: outcomes (with numbers) · QoQ usage trend · open asks · risks from latest health score · next-quarter goal · renewal runway.
**Outcome:** QBR at customers/{slug}/qbr-{YYYY-QN}.md.
## Instructions
Run this as a user-facing action. Use the underlying `prep-meeting` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Prep the QBR for {customer}. Use the prep-meeting skill with type=qbr. Read the customer row + any prior QBR. Pull usage trend via PostHog, billing state via Stripe, open support tickets. Compile: outcomes shipped (vs the locked success metric), usage trend QoQ, open asks, risks (from latest customer-health score), next-quarter goal, renewal runway. Save to customers/{slug}/qbr-{YYYY-QN}.md.
```
