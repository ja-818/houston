---
name: track-metric
description: "Use when you say 'start tracking {metric}' / 'add {KPI} to the dashboard' / 'watch {X}'  -  I write the read-only SQL against your connected warehouse, snapshot the current value into `metrics-daily.json`, append the definition to `config/metrics.json`, and register it for the chosen cadence."
version: 1
tags: [operations, track, metric]
category: Operations
featured: yes
image: clipboard
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Track Metric

## When to use

- "start tracking {X}" / "add {metric} to the dashboard" / "watch {KPI}".
- User-named metric on `onboard-me` has empty `sqlSnippet` placeholder, user invokes this skill to build real definition.

## Steps

1. **Read `context/operations-context.md`.** If missing or empty, stop. Ask user run Head of Operations' `define-operating-context` first.

2. **Clarify if needed.** If phrasing ambiguous ("MRR" could be billing-MRR, contract-MRR, or ARR/12), ask ONE tight question. Else proceed.

3. **Identify source.** Read `config/data-sources.json`. If user didn't name source, pick most likely from `config/business-context.md` (warehouse for core business metrics, product DB for engagement).

4. **Check existing metrics.** Read `config/metrics.json`. If metric with same slug or overwhelmingly similar name exists, tell user, offer update instead of duplicate.

5. **Confirm schema.** Read `config/schemas.json` for referenced tables. If entries missing, lazy-introspect (same pattern as `run-sql-query` step 3).

6. **Draft SQL.** Return `SELECT` resolving to single numeric value for given date. Use `{{date}}` placeholder, scheduler substitutes at run time. Example (BigQuery dialect):

   ```sql
   SELECT SUM(amount) AS value
   FROM `project.dataset.subscriptions`
   WHERE state = 'active'
     AND start_date <= DATE('{{date}}')
     AND (end_date IS NULL OR end_date > DATE('{{date}}'))
   ```

7. **Self-check read-only.** Scan for forbidden DML/DDL keywords. Refuse if any appear.

8. **Capture cadence, direction, unit.** Ask ONE question if not specified:
   - `cadence: "daily"` default.
   - `direction`  -  higher-is-better / lower-is-better / target-is-best.
   - `unit`  -  count / currency / percent / ratio / duration / other.
   Do NOT hardcode thresholds  -  leave `thresholds` empty; if user wants custom sigma for anomaly detection, override later.

9. **Append metric definition** to `config/metrics.json`. Also register reusable query under `queries/{metric-slug}/` for audit (`run-sql-query` reuses it). Update `queries.json`.

10. **Snapshot now.** Execute SQL with `{{date}}` = today (warehouse timezone, default UTC). Append to `metrics-daily.json` with `{ id, metricId, date, value, changeVsPrev, changeVs7dAvg, changeVs28dAvg, createdAt }`. First-snapshot change fields null.

11. **Backfill if asked.** If user said "backfill last N days," loop SQL across dates, append each snapshot. Warn on cost first (compare total estimated scanned bytes vs ceiling).

12. **Append to `outputs.json`** with `type: "metric-tracked"`, status "ready".

13. **Report.** Current value + cadence + where shows on dashboard + note that `detect-anomaly` flags deviations after ≥ 7 snapshots accumulate.

## Outputs

- Updated `config/metrics.json`
- Appended `metrics-daily.json` rows
- New `queries/{metric-slug}/query.sql`, `notes.md`
- Updated `queries.json`
- Possibly updated `config/schemas.json`
- Appends to `outputs.json` with `type: "metric-tracked"`.

## What I never do

- **Hardcode sigma threshold.** Per-metric overrides live in `config/metrics.json` → `thresholds`. Default 2σ, lives in `detect-anomaly`'s documented default  -  not baked into metric records.
- **Execute DML/DDL.** Same read-only rule.
- **Snapshot without fresh value**  -  if query returns NULL, record snapshot with `possibleCauses` note in next anomaly sweep, tell user.