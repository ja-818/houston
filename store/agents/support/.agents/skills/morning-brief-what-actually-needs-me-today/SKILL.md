---
name: morning-brief-what-actually-needs-me-today
description: "I rank open conversations by VIP × SLA-at-risk × unblocking-engineering, cap at 10 items, add a one-line next action per item, and include followups due today. A 2-minute scan - not a dashboard dump."
version: 1
tags: ["support", "overview-action", "scan-inbox"]
category: "Inbox"
featured: yes
integrations: ["gmail", "outlook"]
image: "headphone"
---


# Morning brief  -  what actually needs me today
**Use when:** Top 5-10 ranked by VIP × SLA × unblocking.
**What it does:** I rank open conversations by VIP × SLA-at-risk × unblocking-engineering, cap at 10 items, add a one-line next action per item, and include followups due today. A 2-minute scan  -  not a dashboard dump.
**Outcome:** Brief at `briefings/{date}.md` with 2-3 things that actually need you today.
## Instructions
Run this as a user-facing action. Use the underlying `scan-inbox` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Give me my morning brief. Use the scan-inbox skill with scope=morning-brief. Rank open conversations by VIP × SLA-at-risk × unblocking-engineering, cap at 10 items, add a one-line next action per item, include followups due today. Write to briefings/{YYYY-MM-DD}.md.
```
