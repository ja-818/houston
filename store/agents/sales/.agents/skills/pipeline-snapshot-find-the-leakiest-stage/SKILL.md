---
name: pipeline-snapshot-find-the-leakiest-stage
description: "I pull the open-deal snapshot from your connected CRM and compute count · ARR · avg time-in-stage · stage-to-next conversion per stage. One leakiest transition flagged."
version: 1
tags: ["sales", "overview-action", "analyze"]
category: "CRM"
featured: yes
integrations: ["hubspot", "salesforce", "attio", "gong", "fireflies"]
image: "handshake"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
  - name: week
    label: "Week"
    placeholder: "e.g. 2026-W14"
prompt_template: |
  Give me a pipeline snapshot. Use the analyze skill with subject=pipeline. Pull the open-deal snapshot from my connected CRM. Per stage: count, ARR, average time-in-stage, stage-to-next conversion. Flag the leakiest transition. Save to analyses/pipeline-{{date}}.md and mirror the table to pipeline-reports/{{week}}.md.
---


# Pipeline snapshot  -  find the leakiest stage
**Use when:** Stage counts · ARR · velocity · worst transition.
**What it does:** I pull the open-deal snapshot from your connected CRM and compute count · ARR · avg time-in-stage · stage-to-next conversion per stage. One leakiest transition flagged.
**Outcome:** Snapshot at analyses/pipeline-{date}.md + table at pipeline-reports/{week}.md.
## Instructions
Run this as a user-facing action. Use the underlying `analyze` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Give me a pipeline snapshot. Use the analyze skill with subject=pipeline. Pull the open-deal snapshot from my connected CRM. Per stage: count, ARR, average time-in-stage, stage-to-next conversion. Flag the leakiest transition. Save to analyses/pipeline-{YYYY-MM-DD}.md and mirror the table to pipeline-reports/{YYYY-WNN}.md.
```
