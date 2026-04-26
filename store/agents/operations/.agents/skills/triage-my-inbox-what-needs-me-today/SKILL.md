---
name: triage-my-inbox-what-needs-me-today
description: "I classify last-24h threads into needs-me-today / can-wait / ignore, rank the top bucket by time-sensitivity, and write a verb+object action per thread - not 'review.'"
version: 1
tags: ["operations", "overview-action", "triage"]
category: "Scheduling"
featured: yes
integrations: ["googlecalendar", "gmail", "outlook"]
image: "clipboard"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Triage my inbox. Use the triage skill with surface=inbox. Pull last-24h threads via Gmail / Outlook, classify each into needs-me-today / can-wait / ignore, rank the top bucket by time-sensitivity, and state a specific verb+object action per thread (not 'review'). Save to triage/{{date}}.md.
---


# Triage my inbox  -  what needs me today?
**Use when:** Needs-me / can-wait / ignore with a verb+object per thread.
**What it does:** I classify last-24h threads into needs-me-today / can-wait / ignore, rank the top bucket by time-sensitivity, and write a verb+object action per thread  -  not 'review.'
**Outcome:** Triage at triage/{date}.md with counts + top action.
## Instructions
Run this as a user-facing action. Use the underlying `triage` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Triage my inbox. Use the triage skill with surface=inbox. Pull last-24h threads via Gmail / Outlook, classify each into needs-me-today / can-wait / ignore, rank the top bucket by time-sensitivity, and state a specific verb+object action per thread (not 'review'). Save to triage/{YYYY-MM-DD}.md.
```
