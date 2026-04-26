---
name: prep-me-for-my-2pm-meeting
description: "Deep attendee intel (bio, role, prior threads, public activity, shared history) + a suggested agenda + the ONE thing not to forget."
version: 1
tags: ["operations", "overview-action", "brief"]
category: "Scheduling"
featured: yes
integrations: ["googledrive", "googlecalendar", "gmail", "outlook", "gong", "fireflies", "slack", "linkedin"]
image: "clipboard"
inputs:
  - name: name
    label: "Name"
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
  - name: slug
    label: "Slug"
    required: false
prompt_template: |
  Prep me for my upcoming meeting with {{name}}. Use the brief skill with mode=meeting-pre. Pull recent email threads, public activity, and shared history for each external attendee. Draft a suggested agenda reflecting what they'll likely want, grounded in my priorities from context/operations-context.md. Call out the ONE thing not to forget. Save to meetings/{{date}}-{{slug}}-pre.md.
---


# Prep me for my 2pm meeting
**Use when:** Attendee intel, agenda, the thing not to forget.
**What it does:** Deep attendee intel (bio, role, prior threads, public activity, shared history) + a suggested agenda + the ONE thing not to forget.
**Outcome:** Pre-read at meetings/{date}-{slug}-pre.md.
## Instructions
Run this as a user-facing action. Use the underlying `brief` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Prep me for my upcoming meeting with {name}. Use the brief skill with mode=meeting-pre. Pull recent email threads, public activity, and shared history for each external attendee. Draft a suggested agenda reflecting what they'll likely want, grounded in my priorities from context/operations-context.md. Call out the ONE thing not to forget. Save to meetings/{YYYY-MM-DD}-{slug}-pre.md.
```
