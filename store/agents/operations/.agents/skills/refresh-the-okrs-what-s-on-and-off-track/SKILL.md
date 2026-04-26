---
name: refresh-the-okrs-what-s-on-and-off-track
description: "I refresh each KR via Notion / Airtable / Google Sheets, classify on-track / at-risk / off-track, and surface root causes from decisions + priorities for anything off-track."
version: 1
tags: ["operations", "overview-action", "track-okr"]
category: "Planning"
featured: yes
integrations: ["googlesheets", "notion", "airtable", "linear", "linkedin"]
image: "clipboard"
inputs:
  - name: quarter
    label: "Quarter"
    placeholder: "e.g. 2026-Q1"
prompt_template: |
  Refresh the OKRs. Use the track-okr skill. For each KR, pull the current value via any connected OKR tool (Notion / Airtable / Google Sheets), append a snapshot to okr-history.json, classify on-track / at-risk / off-track, and surface root causes from decisions.json and context/operations-context.md priorities for anything off-track. Save to okrs/{{quarter}}.md.
---


# Refresh the OKRs  -  what's on- and off-track
**Use when:** Per-KR value, direction, root cause if off-track.
**What it does:** I refresh each KR via Notion / Airtable / Google Sheets, classify on-track / at-risk / off-track, and surface root causes from decisions + priorities for anything off-track.
**Outcome:** Snapshot at okrs/{yyyy-qq}.md and row in okr-history.json.
## Instructions
Run this as a user-facing action. Use the underlying `track-okr` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Refresh the OKRs. Use the track-okr skill. For each KR, pull the current value via any connected OKR tool (Notion / Airtable / Google Sheets), append a snapshot to okr-history.json, classify on-track / at-risk / off-track, and surface root causes from decisions.json and context/operations-context.md priorities for anything off-track. Save to okrs/{yyyy-qq}.md.
```
