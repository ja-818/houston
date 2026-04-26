---
name: turn-this-raw-bug-report-into-a-structured-ticket
description: "I take a raw bug report (Sentry alert, user email, Slack message, error text) and produce repro steps, severity from your rules, route, and a paste-ready description for Linear / Jira / GitHub Issues. Never files."
version: 1
tags: ["engineering", "overview-action", "triage-bug-report"]
category: "Triage"
featured: yes
integrations: ["github", "linear", "jira", "slack"]
image: "laptop"
inputs:
  - name: slug
    label: "Slug"
    required: false
prompt_template: |
  Triage this bug report. Use the triage-bug-report skill. I'll paste the raw Sentry alert / user email / error text. Produce reproduction steps (where inferable), severity tied to my severity rules, route (hotfix / current sprint / backlog / close-as-not-a-bug / needs-more-info), and a paste-ready issue description for Linear / Jira / GitHub Issues. Save to bug-triage/{{slug}}.md.
---


# Turn this raw bug report into a structured ticket
**Use when:** Repro, severity, route, paste-ready description.
**What it does:** I take a raw bug report (Sentry alert, user email, Slack message, error text) and produce repro steps, severity from your rules, route, and a paste-ready description for Linear / Jira / GitHub Issues. Never files.
**Outcome:** A structured ticket draft at bug-triage/{slug}.md  -  paste into your tracker.
## Instructions
Run this as a user-facing action. Use the underlying `triage-bug-report` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Triage this bug report. Use the triage-bug-report skill. I'll paste the raw Sentry alert / user email / error text. Produce reproduction steps (where inferable), severity tied to my severity rules, route (hotfix / current sprint / backlog / close-as-not-a-bug / needs-more-info), and a paste-ready issue description for Linear / Jira / GitHub Issues. Save to bug-triage/{slug}.md.
```
