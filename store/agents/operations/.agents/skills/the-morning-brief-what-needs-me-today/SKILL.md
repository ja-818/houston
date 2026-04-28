---
name: the-morning-brief-what-needs-me-today
description: "I aggregate the last 24h of inbox, calendar, Slack, and drive activity into today's plan: Fires (≤3), today's meetings with prep notes, what changed overnight, and the one move to make."
version: 1
tags: ["operations", "overview-action", "brief"]
category: "Planning"
featured: yes
integrations: ["googledrive", "googlecalendar", "gmail", "outlook", "gong", "fireflies", "slack", "linkedin"]
image: "clipboard"
---


# The morning brief  -  what needs me today
**Use when:** Inbox + calendar + chat + drive, ranked. One move picked.
**What it does:** I aggregate the last 24h of inbox, calendar, Slack, and drive activity into today's plan: Fires (≤3), today's meetings with prep notes, what changed overnight, and the one move to make.
**Outcome:** Brief at briefs/{date}.md with the one move called out.
## Instructions
Run this as a user-facing action. Use the underlying `brief` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Give me today's morning brief. Use the brief skill with mode=daily. Roll up the last 24h from my connected inbox (Gmail / Outlook), calendar (Google Calendar), team chat (Slack), and drive (Google Drive). Produce: Fires (≤3), Today's meetings with prep notes, What changed overnight, Can-wait, and the one move for today. Save to briefs/{YYYY-MM-DD}.md.
```
