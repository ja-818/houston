---
name: spec-dashboard
description: "Use when you say 'spec me a dashboard for {X}' / 'I want to see {Y} regularly' / 'build a growth dashboard'  -  I propose sections, per-section visualizations, cadence, and the read-only SQL behind each viz; write the spec to `config/dashboards.json`. Spec only  -  you or your BI tool builds the rendered dashboard."
version: 1
tags: [operations, spec, dashboard]
category: Operations
featured: yes
image: clipboard
---


# Spec Dashboard

## When to use

- "spec me a dashboard for {X}".
- "I want to see {metric group} regularly".
- "build a dashboard for the {growth / retention / churn / revenue} team".

## Steps

1. **Read `context/operations-context.md`.** If missing/empty, stop. Ask you run Head of Operations' `define-operating-context` first. Active priorities shape which metrics belong.

2. **Clarify audience + cadence.** If unclear: "Who's looking at this and how often? (operator daily / exec weekly / growth team daily / on-demand)." Defaults: `audience: "operator"`, `cadence: "daily"`.

3. **Propose metric list.** From `config/metrics.json`, pick metrics fit purpose. If user named untracked metrics, include as placeholders with `sqlSnippet: ""` and recommend `track-metric` first.

4. **Design sections.** 2–4 sections max. Canonical shape:
   - **Top-line KPIs**  -  3-5 single-number tiles for must-knows.
   - **Trends**  -  30/60/90-day time-series for KPIs.
   - **Breakdown**  -  segmented view (segment / product area / cohort / channel).
   - **Anomalies / alerts** (optional)  -  latest flagged outliers from `anomalies.json`.

5. **Per-viz details.** Each visualization specify:
   - `title`
   - `chart`: `line` | `bar` | `number` | `sparkline` | `funnel` | `table`
   - `metricId` if maps to tracked metric
   - `sqlSnippet`  -  parameterized read-only SQL using `{{date}}` / `{{startDate}}` / `{{endDate}}` placeholders
   - `notes`  -  interpretation caveats or known DQ flags

6. **Self-check read-only.** Every `sqlSnippet` must be SELECT-only. Scan for forbidden DML/DDL keywords, refuse if any appear.

7. **Write spec** to `config/dashboards.json` (atomic). Append or update by `id`:

   ```json
   {
     "id": "growth-daily",
     "name": "Growth Daily",
     "audience": "growth team",
     "cadence": "daily",
     "sections": [
       {
         "title": "Top-line",
         "visualizations": [
           {
             "metricId": "signups",
             "title": "Signups (today)",
             "chart": "number",
             "sqlSnippet": "SELECT COUNT(*) AS value FROM events WHERE event='signup' AND DATE(ts) = DATE('{{date}}')",
             "notes": "Excludes bots flagged in users.is_bot"
           }
         ]
       }
     ],
     "createdAt": "...",
     "updatedAt": "..."
   }
   ```

8. **Append to `outputs.json`** with `type: "dashboard-spec"`, status "ready".

9. **Report.** Present spec in chat, one-line summary per section. Next step: "Paste this spec into your BI tool or ask me to translate a specific viz for {your tool}."

## Outputs

- Updated `config/dashboards.json`
- Appends to `outputs.json` with `type: "dashboard-spec"`.

## What I never do

- **Render HTML / rendered dashboard**  -  spec only. Houston agent view separate, covers operator view. Your BI tool renders this spec.
- **Write `sqlSnippet`s containing DML/DDL**  -  every snippet passes forbidden-keyword scan.
- **Assume specific BI tool**  -  spec tool-agnostic with parameter placeholders.