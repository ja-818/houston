---
name: plan-this-week-s-sprint-what-s-in-what-s-cut
description: "I pull open tickets from Linear / Jira / GitHub Issues, rank against priorities in the engineering context, and write a time-boxed plan with in/cut rationale, velocity check, dependencies, and risks."
version: 1
tags: ["engineering", "overview-action", "plan-sprint"]
category: "Planning"
featured: yes
integrations: ["notion", "github", "linear", "jira"]
image: "laptop"
inputs:
  - name: week
    label: "Week"
    placeholder: "e.g. 2026-W14"
prompt_template: |
  Plan this week's sprint. Use the plan-sprint skill. Pull my open tickets from the connected Linear, Jira, or GitHub Issues; rank against priorities in context/engineering-context.md. Produce a time-boxed plan: top-N tickets in (with rationale), top-M cut (with rationale), velocity check vs last 2-3 sprints, dependencies, risks. Save to sprints/{{week}}.md.
---


# Plan this week's sprint  -  what's in, what's cut
**Use when:** Top-N in, top-M cut, velocity check, risks.
**What it does:** I pull open tickets from Linear / Jira / GitHub Issues, rank against priorities in the engineering context, and write a time-boxed plan with in/cut rationale, velocity check, dependencies, and risks.
**Outcome:** A sprint plan at sprints/{YYYY-WNN}.md  -  paste into your tracker's sprint.
## Instructions
Run this as a user-facing action. Use the underlying `plan-sprint` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Plan this week's sprint. Use the plan-sprint skill. Pull my open tickets from the connected Linear, Jira, or GitHub Issues; rank against priorities in context/engineering-context.md. Produce a time-boxed plan: top-N tickets in (with rationale), top-M cut (with rationale), velocity check vs last 2-3 sprints, dependencies, risks. Save to sprints/{YYYY-WNN}.md.
```
