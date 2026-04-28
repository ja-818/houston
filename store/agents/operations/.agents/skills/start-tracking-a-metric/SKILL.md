---
name: start-tracking-a-metric
description: "I write the read-only SQL against your connected warehouse, snapshot the value daily into metrics-daily.json, and register the metric for tracking."
version: 1
tags: ["operations", "overview-action", "track-metric"]
category: "Data"
featured: yes
integrations: ["airtable", "firecrawl", "fireflies", "gmail", "gong", "googlecalendar", "googledocs", "googledrive", "googlesheets", "linear", "linkedin", "notion", "outlook", "perplexityai", "slack", "stripe"]
image: "clipboard"
---


# Start tracking a metric
**Use when:** Read-only SQL + daily snapshot + registry entry.
**What it does:** I write the read-only SQL against your connected warehouse, snapshot the value daily into metrics-daily.json, and register the metric for tracking.
**Outcome:** Entry in config/metrics.json + first snapshot in metrics-daily.json.
## Instructions
Run this as a user-facing action. Use the underlying `track-metric` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Start tracking {metric}. Use the track-metric skill. Write the read-only SQL against my connected warehouse (Postgres / BigQuery / Snowflake via Composio), snapshot the current value into metrics-daily.json, append the definition to config/metrics.json, and register it for daily cadence.
```
