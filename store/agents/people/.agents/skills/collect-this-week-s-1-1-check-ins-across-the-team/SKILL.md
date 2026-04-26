---
name: collect-this-week-s-1-1-check-ins-across-the-team
description: "Sends the check-in prompt via Slack, gathers responses, writes a dated report with themes and quiet-flags. Runs weekly - perfect for a Monday kick-off."
version: 1
tags: ["people", "overview-action", "collect-checkins"]
category: "Performance"
featured: yes
integrations: ["slack", "discord"]
image: "busts-in-silhouette"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Collect this week's 1:1 check-ins. Use the collect-checkins skill. Pull the roster from my connected HRIS, send the check-in prompt via my connected Slack channel, gather responses, and write a dated report to checkins/{{date}}.md with themes, who's quiet, and flagged responses.
---


# Collect this week's 1:1 check-ins across the team
**Use when:** Who responded, who's quiet, themes, flags.
**What it does:** Sends the check-in prompt via Slack, gathers responses, writes a dated report with themes and quiet-flags. Runs weekly  -  perfect for a Monday kick-off.
**Outcome:** Weekly report at checkins/{date}.md. Open flagged responses into stay conversations if needed.
## Instructions
Run this as a user-facing action. Use the underlying `collect-checkins` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Collect this week's 1:1 check-ins. Use the collect-checkins skill. Pull the roster from my connected HRIS, send the check-in prompt via my connected Slack channel, gather responses, and write a dated report to checkins/{YYYY-MM-DD}.md with themes, who's quiet, and flagged responses.
```
