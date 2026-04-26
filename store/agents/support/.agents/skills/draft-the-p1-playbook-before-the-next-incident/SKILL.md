---
name: draft-the-p1-playbook-before-the-next-incident
description: "I ask 2 targeted questions, then write a step-by-step runbook: detection, comms draft, rollback, RCA, post-mortem. Named humans, named Slack channels - no vague handoffs."
version: 1
tags: ["support", "overview-action", "draft-escalation-playbook"]
category: "Quality"
featured: yes
integrations: ["github", "linear", "slack", "microsoftteams"]
image: "headphone"
inputs:
  - name: request
    label: "Additional context"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Draft the P1 playbook. Use the draft-escalation-playbook skill. Ask 2 targeted questions (what counts as P1, who gets looped in), then write a step-by-step runbook to playbooks/p1-outage.md: first 15 min (detect + contain), first 60 min (customer comms + VIP DMs), same day (RCA + customer-facing RCA), 48h follow-up (post-mortem + known-issue article + personal follow-ups). Named humans, named channels.

  Additional context: {{request}}
---


# Draft the P1 playbook before the next incident
**Use when:** Detection, comms, rollback, RCA, post-mortem.
**What it does:** I ask 2 targeted questions, then write a step-by-step runbook: detection, comms draft, rollback, RCA, post-mortem. Named humans, named Slack channels  -  no vague handoffs.
**Outcome:** Playbook at `playbooks/{slug}.md`  -  edit once, every incident uses it.
## Instructions
Run this as a user-facing action. Use the underlying `draft-escalation-playbook` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft the P1 playbook. Use the draft-escalation-playbook skill. Ask 2 targeted questions (what counts as P1, who gets looped in), then write a step-by-step runbook to playbooks/p1-outage.md: first 15 min (detect + contain), first 60 min (customer comms + VIP DMs), same day (RCA + customer-facing RCA), 48h follow-up (post-mortem + known-issue article + personal follow-ups). Named humans, named channels.
```
