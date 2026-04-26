---
name: the-weekly-metrics-rollup
description: "Cross-metric week-over-week pulse: every tracked metric, WoW change, classification vs direction, open anomalies. Ranked by biggest movement."
version: 1
tags: ["operations", "overview-action", "run-review"]
category: "Data"
featured: yes
integrations: ["googlesheets"]
image: "clipboard"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Give me the weekly metrics rollup. Use the run-review skill with period=metrics-rollup. Read every tracked metric from metrics-daily.json (last 14 snapshots each), compute week-over-week change and classification vs declared direction, flag any open anomaly from anomalies.json, and rank by biggest movement. Save to rollups/{{date}}.md.
---


# The weekly metrics rollup
**Use when:** Every tracked metric, WoW change, classification, anomalies.
**What it does:** Cross-metric week-over-week pulse: every tracked metric, WoW change, classification vs direction, open anomalies. Ranked by biggest movement.
**Outcome:** Rollup at rollups/{date}.md  -  top 3 movers called out.
## Instructions
Run this as a user-facing action. Use the underlying `run-review` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Give me the weekly metrics rollup. Use the run-review skill with period=metrics-rollup. Read every tracked metric from metrics-daily.json (last 14 snapshots each), compute week-over-week change and classification vs declared direction, flag any open anomaly from anomalies.json, and rank by biggest movement. Save to rollups/{YYYY-MM-DD}.md.
```
