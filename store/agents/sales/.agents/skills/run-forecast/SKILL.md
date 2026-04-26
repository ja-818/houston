---
name: run-forecast
description: "Use when you say 'build this week's forecast' / 'commit / best / pipeline'  -  I pull open deals from your connected CRM (HubSpot / Salesforce / Attio / Pipedrive / Close), classify each against the playbook's deal-stage exit criteria into Commit / Best / Pipeline / Omit, roll up ARR per bucket, and compare to last week's forecast to flag slippage. Writes to `forecasts/{YYYY-WNN}.md`."
version: 1
tags: [sales, run, forecast]
category: Sales
featured: yes
image: handshake
integrations: [hubspot, salesforce, attio, pipedrive]
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Run Forecast

## When to use

- "build this week's forecast".
- "commit / best / pipeline rollup".
- Scheduled: Friday afternoon, before HoS review.

## Steps

1. **Read playbook.** `context/sales-context.md`. Deal stages + exit criteria drive confidence.

2. **Load open deals.** `deals.json` joined with `deals/*/close-plan.md` target-close dates.

3. **Score confidence per deal.** Confidence = min(stage-confidence, qualification-completeness, close-plan-completeness):

   - **Commit (>80%):** last stage, economic buyer + champion known, close plan all steps GREEN, date within forecast window.
   - **Best (40–80%):** mid-funnel stage, most pillars filled, close plan present but has UNKNOWNs.
   - **Pipeline (10–40%):** early stage, qualification thin.
   - **Omit (<10%):** stalled, no recent touch, or health RED unlikely to resolve.

4. **Roll up per bucket.** Count, sum ARR, list deals.

5. **Compare last week forecast.** Load `forecasts/{prior-week}.md`. Per deal, flag movement (up / down / unchanged / new / gone).

6. **Write forecast** to `forecasts/{YYYY-WW}.md.tmp` → rename:

   ```markdown
   # Forecast  -  Week {YYYY-WW}

   ## Commit  -  ${ARR} ({N} deals)
   - {Deal} · ${ARR} · target {date} · drivers: ...
   ## Best  -  ${ARR} ({N})
   ...
   ## Pipeline  -  ${ARR} ({N})
   ...
   ## Omit  -  ${ARR} ({N})
   ...

   ## Week-over-week
   - Moved UP: {Deal} from Best → Commit (champion aligned EB)
   - Moved DOWN: {Deal} from Commit → Best (legal review surprise)
   - NEW in Commit: ...
   - GONE from Commit: ...

   ## Headline
   Committed total ${X} (last week ${Y}, {delta}).
   ```

7. **Append to `outputs.json`** with `type: "forecast"`.

8. **Summarize.** Headline number + biggest week-over-week move.

## Outputs

- `forecasts/{YYYY-WW}.md`
- Appends to `outputs.json`.