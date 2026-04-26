---
name: daily-anomaly-sweep-anything-weird
description: "I compare every tracked metric against its 7-day and 28-day baselines, flag deviations past threshold, and hypothesize 1-3 causes for each."
version: 1
tags: ["operations", "overview-action", "analyze"]
category: "Data"
featured: yes
integrations: ["airtable", "firecrawl", "fireflies", "gmail", "gong", "googlecalendar", "googledocs", "googledrive", "googlesheets", "linear", "linkedin", "notion", "outlook", "perplexityai", "slack", "stripe"]
image: "clipboard"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Run an anomaly sweep. Use the analyze skill with subject=anomaly. For each metric in config/metrics.json with ≥7 snapshots, compute 7-day and 28-day rolling baselines, flag deviations past the per-metric threshold or default (2σ yellow / 3σ red), and hypothesize 1-3 possible causes from recent decisions, deploys, and experiments. Save to analyses/anomaly-sweep-{{date}}.md and upsert anomalies.json.
---


# Daily anomaly sweep  -  anything weird?
**Use when:** Deviations past baseline + 1-3 hypothesized causes each.
**What it does:** I compare every tracked metric against its 7-day and 28-day baselines, flag deviations past threshold, and hypothesize 1-3 causes for each.
**Outcome:** Sweep at analyses/anomaly-sweep-{date}.md + rows in anomalies.json.
## Instructions
Run this as a user-facing action. Use the underlying `analyze` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Run an anomaly sweep. Use the analyze skill with subject=anomaly. For each metric in config/metrics.json with ≥7 snapshots, compute 7-day and 28-day rolling baselines, flag deviations past the per-metric threshold or default (2σ yellow / 3σ red), and hypothesize 1-3 possible causes from recent decisions, deploys, and experiments. Save to analyses/anomaly-sweep-{YYYY-MM-DD}.md and upsert anomalies.json.
```
