---
name: draft-a-30-60-90-plan-for-a-new-hire-starting-monday
description: "Day 0 checklist, Week 1 plan, 30-60-90 milestones, welcome Slack message, welcome email - all scoped to the level in your context doc."
version: 1
tags: ["people", "overview-action", "draft-onboarding-plan"]
category: "Onboarding"
featured: yes
integrations: ["gmail", "notion", "slack"]
image: "busts-in-silhouette"
inputs:
  - name: new_hire
    label: "New Hire"
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
  - name: employee_slug
    label: "Employee Slug"
    required: false
prompt_template: |
  Draft the onboarding plan for {{new_hire}} starting {{date}}. Use the draft-onboarding-plan skill. Read leveling and voice from context/people-context.md. Produce a Day 0 / Week 1 / 30-60-90 plan plus welcome Slack and welcome email drafts at onboarding-plans/{{employee_slug}}.md.
---


# Draft a 30-60-90 plan for a new hire starting Monday
**Use when:** Day 0 · Week 1 · 30/60/90 + welcome Slack + welcome email.
**What it does:** Day 0 checklist, Week 1 plan, 30-60-90 milestones, welcome Slack message, welcome email  -  all scoped to the level in your context doc.
**Outcome:** Full plan at onboarding-plans/{slug}.md. You edit, approve, run Day 0.
## Instructions
Run this as a user-facing action. Use the underlying `draft-onboarding-plan` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft the onboarding plan for {new hire} starting {date}. Use the draft-onboarding-plan skill. Read leveling and voice from context/people-context.md. Produce a Day 0 / Week 1 / 30-60-90 plan plus welcome Slack and welcome email drafts at onboarding-plans/{employee-slug}.md.
```
