---
name: scan-my-calendar-for-the-week
description: "I scan the next 7 days for overbooks, missing buffers, focus-block clashes, unprotected VIP time, and external meetings with no prep. Ranked by severity."
version: 1
tags: ["operations", "overview-action", "triage"]
category: "Scheduling"
featured: yes
integrations: ["googlecalendar", "gmail", "outlook"]
image: "clipboard"
---


# Scan my calendar for the week
**Use when:** Overbooks, missing buffers, VIP slots, unprepped meetings.
**What it does:** I scan the next 7 days for overbooks, missing buffers, focus-block clashes, unprotected VIP time, and external meetings with no prep. Ranked by severity.
**Outcome:** Scan at calendar-scans/{date}.md with the worst conflict called out.
## Instructions
Run this as a user-facing action. Use the underlying `triage` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Scan my calendar for the next 7 days. Use the triage skill with surface=calendar. Flag overbooks, back-to-back-with-no-buffer, focus-block clashes, unprotected VIP slots, and external meetings without prep. Rank by severity. Save to calendar-scans/{YYYY-MM-DD}.md and upsert calendar-conflicts.json.
```
