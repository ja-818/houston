---
name: brief-me-for-today
description: "I produce today's calendar (from your connected Google Calendar), the approvals queue from drafts in outputs.json, and the top 3 moves for the day - one screen, no digging."
version: 1
tags: ["sales", "overview-action", "daily-brief"]
category: "Playbook"
featured: yes
integrations: ["googlecalendar"]
image: "handshake"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Brief me for today. Use the daily-brief skill. Produce today's calendar (pull from my connected Google Calendar), approvals queue (drafts from outputs.json with status:draft), and top 3 moves for the day. Save to briefs/{{date}}.md.
---


# Brief me for today
**Use when:** Calendar + approvals queue + top 3 moves.
**What it does:** I produce today's calendar (from your connected Google Calendar), the approvals queue from drafts in outputs.json, and the top 3 moves for the day  -  one screen, no digging.
**Outcome:** Daily brief at briefs/{date}.md.
## Instructions
Run this as a user-facing action. Use the underlying `daily-brief` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Brief me for today. Use the daily-brief skill. Produce today's calendar (pull from my connected Google Calendar), approvals queue (drafts from outputs.json with status:draft), and top 3 moves for the day. Save to briefs/{YYYY-MM-DD}.md.
```
