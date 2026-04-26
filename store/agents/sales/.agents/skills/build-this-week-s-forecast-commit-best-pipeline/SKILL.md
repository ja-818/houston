---
name: build-this-week-s-forecast-commit-best-pipeline
description: "Classify every open deal against the playbook's deal-stage exit criteria into Commit / Best / Pipeline / Omit. Roll up ARR. Flag slippage vs last week."
version: 1
tags: ["sales", "overview-action", "run-forecast"]
category: "CRM"
featured: yes
integrations: ["hubspot", "salesforce", "attio", "pipedrive"]
image: "handshake"
inputs:
  - name: week
    label: "Week"
    placeholder: "e.g. 2026-W14"
prompt_template: |
  Build this week's forecast. Use the run-forecast skill. Pull open deals from my connected CRM, classify each against the playbook's deal-stage exit criteria into Commit / Best / Pipeline / Omit buckets, roll up ARR per bucket, and compare to last week's forecast to flag slippage. Save to forecasts/{{week}}.md.
---


# Build this week's forecast  -  Commit / Best / Pipeline
**Use when:** Classify deals vs playbook exit criteria.
**What it does:** Classify every open deal against the playbook's deal-stage exit criteria into Commit / Best / Pipeline / Omit. Roll up ARR. Flag slippage vs last week.
**Outcome:** Forecast at forecasts/{YYYY-WNN}.md with slippage highlighted.
## Instructions
Run this as a user-facing action. Use the underlying `run-forecast` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Build this week's forecast. Use the run-forecast skill. Pull open deals from my connected CRM, classify each against the playbook's deal-stage exit criteria into Commit / Best / Pipeline / Omit buckets, roll up ARR per bucket, and compare to last week's forecast to flag slippage. Save to forecasts/{YYYY-WNN}.md.
```
