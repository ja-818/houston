---
name: spec-a-dashboard-i-can-actually-build
description: "Sections, per-section visualizations, cadence, and the read-only SQL behind each viz - the spec, not the rendered dashboard."
version: 1
tags: ["operations", "overview-action", "spec-dashboard"]
category: "Data"
featured: yes
integrations: ["airtable", "firecrawl", "fireflies", "gmail", "gong", "googlecalendar", "googledocs", "googledrive", "googlesheets", "linear", "linkedin", "notion", "outlook", "perplexityai", "slack", "stripe"]
image: "clipboard"
---


# Spec a dashboard I can actually build
**Use when:** Sections, viz, cadence, read-only SQL per viz.
**What it does:** Sections, per-section visualizations, cadence, and the read-only SQL behind each viz  -  the spec, not the rendered dashboard.
**Outcome:** Spec saved to config/dashboards.json.
## Instructions
Run this as a user-facing action. Use the underlying `spec-dashboard` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Spec me a {topic} dashboard. Use the spec-dashboard skill. Propose sections, per-section visualizations (what chart, what it shows), cadence (live / daily / weekly / monthly), and the read-only SQL behind each viz. Save the spec to config/dashboards.json  -  you or your BI tool builds the rendered dashboard.
```
