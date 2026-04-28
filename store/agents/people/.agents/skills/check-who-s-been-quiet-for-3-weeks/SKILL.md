---
name: check-who-s-been-quiet-for-3-weeks
description: "Cross-references the last 4 checkins/{date}.md reports, surfaces team members quiet for 3+ weeks, recommends next moves (stay conversation or 1:1)."
version: 1
tags: ["people", "overview-action", "collect-checkins"]
category: "Performance"
featured: yes
integrations: ["slack", "discord"]
image: "busts-in-silhouette"
---


# Check who's been quiet for 3+ weeks
**Use when:** Cross-reference check-in history → surface silences.
**What it does:** Cross-references the last 4 checkins/{date}.md reports, surfaces team members quiet for 3+ weeks, recommends next moves (stay conversation or 1:1).
**Outcome:** Quiet-patterns section appended to the week's checkins/{date}.md  -  open flags into stay conversations.
## Instructions
Run this as a user-facing action. Use the underlying `collect-checkins` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Find team members who've been quiet in check-ins for 3+ weeks. Use the collect-checkins skill to read the last 4 weekly reports in checkins/, cross-reference with the roster, and surface everyone who has missed 3+ responses in a row. Append a `## Quiet Patterns` section to checkins/{YYYY-MM-DD}.md with names, last-response date, and recommended next move (stay conversation, 1:1 check-in, or nothing if context explains the silence).
```
