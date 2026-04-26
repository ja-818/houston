---
name: re-activate-signups-who-never-activated
description: "Event-triggered drip: trigger event, frequency rules, branching by user action, drafted copy per email. Honest about when to stop emailing."
version: 1
tags: ["marketing", "overview-action", "plan-campaign"]
category: "Email"
featured: yes
integrations: ["hubspot", "stripe", "linkedin", "mailchimp", "customerio", "googleads", "metaads"]
image: "megaphone"
inputs:
  - name: slug
    label: "Slug"
    required: false
prompt_template: |
  Design a re-activation drip for users who signed up but never activated. Use the plan-campaign skill with type=lifecycle-drip. Event-triggered: trigger event, frequency rules, branching by user action, drafted copy per email. Honest about when to stop emailing. Save to campaigns/lifecycle-drip-{{slug}}.md.
---


# Re-activate signups who never activated
**Use when:** Event-triggered drip with honest stopping rules.
**What it does:** Event-triggered drip: trigger event, frequency rules, branching by user action, drafted copy per email. Honest about when to stop emailing.
**Outcome:** Drip plan at campaigns/lifecycle-drip-{slug}.md with every branch labeled.
## Instructions
Run this as a user-facing action. Use the underlying `plan-campaign` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Design a re-activation drip for users who signed up but never activated. Use the plan-campaign skill with type=lifecycle-drip. Event-triggered: trigger event, frequency rules, branching by user action, drafted copy per email. Honest about when to stop emailing. Save to campaigns/lifecycle-drip-{slug}.md.
```
