---
name: build-my-renewal-calendar
description: "I scan your contracts folder and Google Drive, extract renewal dates + notice windows + auto-renew language, and maintain a living calendar + per-quarter digest."
version: 1
tags: ["operations", "overview-action", "track-renewals"]
category: "Finance"
featured: yes
integrations: ["googledrive"]
image: "clipboard"
inputs:
  - name: quarter
    label: "Quarter"
    placeholder: "e.g. 2026-Q1"
prompt_template: |
  Build my renewal calendar. Use the track-renewals skill. Scan contracts/ and any connected Google Drive folder, extract renewal dates + notice windows + auto-renew language. Maintain the living renewals/calendar.md and a per-quarter digest at renewals/{{quarter}}.md.
---


# Build my renewal calendar
**Use when:** Renewal dates + notice windows + auto-renew language.
**What it does:** I scan your contracts folder and Google Drive, extract renewal dates + notice windows + auto-renew language, and maintain a living calendar + per-quarter digest.
**Outcome:** Living calendar at renewals/calendar.md + per-quarter digest.
## Instructions
Run this as a user-facing action. Use the underlying `track-renewals` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Build my renewal calendar. Use the track-renewals skill. Scan contracts/ and any connected Google Drive folder, extract renewal dates + notice windows + auto-renew language. Maintain the living renewals/calendar.md and a per-quarter digest at renewals/{yyyy-qq}.md.
```
