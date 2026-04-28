---
name: sequence-a-2-week-launch-across-every-domain
description: "I break the launch into pre-launch (7d out), launch day, post-launch. Each task tagged to the follow-up skill inside this same agent - no cross-agent handoffs."
version: 1
tags: ["marketing", "overview-action", "plan-campaign"]
category: "Positioning"
featured: yes
integrations: ["hubspot", "stripe", "linkedin", "mailchimp", "customerio", "googleads", "metaads"]
image: "megaphone"
---


# Sequence a 2-week launch across every domain
**Use when:** Pre-launch, launch day, post-launch  -  one plan.
**What it does:** I break the launch into pre-launch (7d out), launch day, post-launch. Each task tagged to the follow-up skill inside this same agent  -  no cross-agent handoffs.
**Outcome:** Sequenced plan at campaigns/launch-{slug}.md with owner + timing per task.
## Instructions
Run this as a user-facing action. Use the underlying `plan-campaign` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Plan the {feature} launch over the next 2 weeks. Use the plan-campaign skill with type=launch. Break it into pre-launch (7d out), launch day, post-launch. Each task tagged with the right follow-up skill in this agent (write-content for launch post, plan-campaign type=paid for ad creative, plan-campaign type=announcement for email + in-app, write-page-copy for landing updates). Save to campaigns/launch-{slug}.md.
```
