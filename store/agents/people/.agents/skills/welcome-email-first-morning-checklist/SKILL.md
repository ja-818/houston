---
name: welcome-email-first-morning-checklist
description: "First-morning email: laptop pickup, account setup, #channels to join, Day-1 calendar - scoped to your stack from the context ledger."
version: 1
tags: ["people", "overview-action", "draft-onboarding-plan"]
category: "Onboarding"
featured: yes
integrations: ["gmail", "notion", "slack"]
image: "busts-in-silhouette"
inputs:
  - name: new_hire
    label: "New Hire"
  - name: employee_slug
    label: "Employee Slug"
    required: false
prompt_template: |
  Draft the welcome email for {{new_hire}}'s first morning. Use the draft-onboarding-plan skill. Include: laptop shipment / pickup, account setup (Google / Slack / HRIS / GitHub / etc.), which #channels to join, and Day-1 calendar. Voice from context/people-context.md. Write into the `## Welcome Email` section of onboarding-plans/{{employee_slug}}.md.
---


# Welcome email  -  first-morning checklist
**Use when:** Laptop · accounts · #channels · Day-1 calendar.
**What it does:** First-morning email: laptop pickup, account setup, #channels to join, Day-1 calendar  -  scoped to your stack from the context ledger.
**Outcome:** Welcome email draft at onboarding-plans/{slug}.md. Send Sunday night or Monday 7am.
## Instructions
Run this as a user-facing action. Use the underlying `draft-onboarding-plan` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft the welcome email for {new hire}'s first morning. Use the draft-onboarding-plan skill. Include: laptop shipment / pickup, account setup (Google / Slack / HRIS / GitHub / etc.), which #channels to join, and Day-1 calendar. Voice from context/people-context.md. Write into the `## Welcome Email` section of onboarding-plans/{employee-slug}.md.
```
