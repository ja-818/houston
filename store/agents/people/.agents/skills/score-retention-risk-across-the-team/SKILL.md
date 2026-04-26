---
name: score-retention-risk-across-the-team
description: "Fuses check-in responsiveness, sentiment, tenure milestones, and comp exposure into GREEN / YELLOW / RED per person. Every RED shows the exact signal combination."
version: 1
tags: ["people", "overview-action", "analyze"]
category: "Performance"
featured: yes
integrations: ["hubspot", "github", "linear", "jira", "slack", "discord", "firecrawl"]
image: "busts-in-silhouette"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Score retention risk across the team. Use the analyze skill with subject=retention-risk. Fuse engagement (check-ins, Slack activity, optional PR / ticket cadence), sentiment (check-in tone drift), tenure milestones (cliff vesting, promotion honeymoon, manager change), and comp exposure (vs bands in context/people-context.md). Classify GREEN / YELLOW / RED and write the exact signal combination on every RED. Save to analyses/retention-risk-{{date}}.md. Founder-eyes-only.
---


# Score retention risk across the team
**Use when:** GREEN / YELLOW / RED per person, signal evidence cited.
**What it does:** Fuses check-in responsiveness, sentiment, tenure milestones, and comp exposure into GREEN / YELLOW / RED per person. Every RED shows the exact signal combination.
**Outcome:** Report at analyses/retention-risk-{date}.md. For each RED: run draft-performance-doc type=stay-conversation.
## Instructions
Run this as a user-facing action. Use the underlying `analyze` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Score retention risk across the team. Use the analyze skill with subject=retention-risk. Fuse engagement (check-ins, Slack activity, optional PR / ticket cadence), sentiment (check-in tone drift), tenure milestones (cliff vesting, promotion honeymoon, manager change), and comp exposure (vs bands in context/people-context.md). Classify GREEN / YELLOW / RED and write the exact signal combination on every RED. Save to analyses/retention-risk-{YYYY-MM-DD}.md. Founder-eyes-only.
```
