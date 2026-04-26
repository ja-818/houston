---
name: analyze-an-experiment-ship-kill-iterate
description: "Lift + significance + CI + guardrails, with an explicit ship / kill / iterate / inconclusive-extend call. Never recommends SHIP without significance."
version: 1
tags: ["operations", "overview-action", "analyze"]
category: "Data"
featured: yes
integrations: ["airtable", "firecrawl", "fireflies", "gmail", "gong", "googlecalendar", "googledocs", "googledrive", "googlesheets", "linear", "linkedin", "notion", "outlook", "perplexityai", "slack", "stripe"]
image: "clipboard"
inputs:
  - name: name
    label: "Name"
  - name: slug
    label: "Slug"
    required: false
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Analyze experiment {{name}}. Use the analyze skill with subject=experiment. Pull variant data from my connected warehouse or accept pasted aggregates. Compute lift, statistical significance, 95% CI, observed MDE, guardrail deltas. Make the call: SHIP / KILL / ITERATE / INCONCLUSIVE-EXTEND. Save to analyses/experiment-{{slug}}-{{date}}.md. Never recommends SHIP without significance.
---


# Analyze an experiment  -  ship / kill / iterate
**Use when:** Lift + significance + CI + guardrails. Explicit call.
**What it does:** Lift + significance + CI + guardrails, with an explicit ship / kill / iterate / inconclusive-extend call. Never recommends SHIP without significance.
**Outcome:** Readout at analyses/experiment-{slug}-{date}.md.
## Instructions
Run this as a user-facing action. Use the underlying `analyze` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Analyze experiment {name}. Use the analyze skill with subject=experiment. Pull variant data from my connected warehouse or accept pasted aggregates. Compute lift, statistical significance, 95% CI, observed MDE, guardrail deltas. Make the call: SHIP / KILL / ITERATE / INCONCLUSIVE-EXTEND. Save to analyses/experiment-{slug}-{YYYY-MM-DD}.md. Never recommends SHIP without significance.
```
