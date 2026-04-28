---
name: track-this-follow-up-so-i-don-t-drop-it
description: "I log the commitment (who / what / by when) to followups.json. On the due date I surface it; when you say 'handle due follow-ups' I draft the fulfillment or an honest bump."
version: 1
tags: ["operations", "overview-action", "draft-message"]
category: "Scheduling"
featured: yes
integrations: ["gmail", "outlook"]
image: "clipboard"
---


# Track this follow-up so I don't drop it
**Use when:** Who / what / by when. Surfaced when due.
**What it does:** I log the commitment (who / what / by when) to followups.json. On the due date I surface it; when you say 'handle due follow-ups' I draft the fulfillment or an honest bump.
**Outcome:** Row in followups.json.
## Instructions
Run this as a user-facing action. Use the underlying `draft-message` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Track this follow-up. Use the draft-message skill with type=followup (TRACK sub-mode). Extract who owes what to whom by when, append to followups.json. When the due date arrives I'll surface it and  -  when you say 'handle due follow-ups'  -  draft the fulfillment or an honest bump.
```
