---
name: turn-a-brain-dump-into-today-s-plan
description: "Paste your unstructured thoughts - I bucket them, cross-reference your calendar, pick 2-3 strategic items against your priorities, and flag delegation candidates."
version: 1
tags: ["operations", "overview-action", "brief"]
category: "Planning"
featured: yes
integrations: ["googledrive", "googlecalendar", "gmail", "outlook", "gong", "fireflies", "slack", "linkedin"]
image: "clipboard"
---


# Turn a brain dump into today's plan
**Use when:** Parse, bucket, calendar-check, strategic picks.
**What it does:** Paste your unstructured thoughts  -  I bucket them, cross-reference your calendar, pick 2-3 strategic items against your priorities, and flag delegation candidates.
**Outcome:** Structured plan at briefs/{date}-dump.md.
## Instructions
Run this as a user-facing action. Use the underlying `brief` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Turn this brain dump into today's plan: {paste thoughts}. Use the brief skill with mode=daily  -  it'll auto-detect brain-dump sub-mode from the >100-word paste. Bucket into urgent-fires / strategic / operational / future-ideas / personal; calendar reality check; 2-3 strategic picks grounded in my active priorities; delegation candidates; parking lot. Save to briefs/{YYYY-MM-DD}-dump.md.
```
