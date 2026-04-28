---
name: plan-onboarding-for-a-new-customer
description: "Kickoff agenda · one locked success metric · 90-day time-to-value timeline with milestones and risks - the anchor every later QBR and renewal pulls from."
version: 1
tags: ["sales", "overview-action", "plan-onboarding"]
category: "Retention"
featured: yes
integrations: ["attio", "firecrawl", "fireflies", "gmail", "gong", "googlecalendar", "googledocs", "hubspot", "linear", "linkedin", "notion", "outlook", "perplexityai", "pipedrive", "reddit", "salesforce", "stripe", "twitter"]
image: "handshake"
---


# Plan onboarding for a new customer
**Use when:** Kickoff agenda · locked success metric · 90-day plan.
**What it does:** Kickoff agenda · one locked success metric · 90-day time-to-value timeline with milestones and risks  -  the anchor every later QBR and renewal pulls from.
**Outcome:** Plan at customers/{slug}/onboarding-plan.md.
## Instructions
Run this as a user-facing action. Use the underlying `plan-onboarding` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Plan onboarding for {customer}. Use the plan-onboarding skill. Build a kickoff agenda, lock one concrete success metric with the customer, and sequence a 90-day time-to-value timeline with milestones and risks. Save to customers/{slug}/onboarding-plan.md.
```
