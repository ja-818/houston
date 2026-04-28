---
name: turn-my-last-call-into-decisions-follow-ups
description: "From your Fireflies / Gong transcript (or paste): decisions made, owners + dates for every follow-up, open questions, and quotes worth keeping."
version: 1
tags: ["operations", "overview-action", "brief"]
category: "Scheduling"
featured: yes
integrations: ["googledrive", "googlecalendar", "gmail", "outlook", "gong", "fireflies", "slack", "linkedin"]
image: "clipboard"
---


# Turn my last call into decisions + follow-ups
**Use when:** Decisions, owners, dates, quotes worth keeping.
**What it does:** From your Fireflies / Gong transcript (or paste): decisions made, owners + dates for every follow-up, open questions, and quotes worth keeping.
**Outcome:** Notes at meetings/{date}-{slug}-post.md.
## Instructions
Run this as a user-facing action. Use the underlying `brief` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Give me the post-meeting notes from my last meeting. Use the brief skill with mode=meeting-post. Pull the transcript from my connected Fireflies / Gong (or accept pasted transcript). Extract decisions made, owners + dates for every follow-up, open questions, and 2-4 verbatim quotes worth keeping. Flag any decision-shaped items as log-decision candidates. Save to meetings/{YYYY-MM-DD}-{slug}-post.md.
```
