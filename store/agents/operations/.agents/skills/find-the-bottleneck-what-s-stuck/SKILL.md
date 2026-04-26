---
name: find-the-bottleneck-what-s-stuck
description: "I cluster evidence from your reviews, decisions, anomalies, and off-track KRs into named bottlenecks - each with a hypothesis and a proposed owner to unblock."
version: 1
tags: ["operations", "overview-action", "identify-bottleneck"]
category: "Planning"
featured: yes
integrations: ["airtable", "firecrawl", "fireflies", "gmail", "gong", "googlecalendar", "googledocs", "googledrive", "googlesheets", "linear", "linkedin", "notion", "outlook", "perplexityai", "slack", "stripe"]
image: "clipboard"
inputs:
  - name: request
    label: "Additional context"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Tell me what's stuck. Use the identify-bottleneck skill. Cluster evidence from recent weekly reviews, open decisions, open anomalies, off-track OKRs, and bounced follow-ups. Produce 1-3 named bottlenecks each with a hypothesis and a proposed owner to unblock. Append to bottlenecks.json.

  Additional context: {{request}}
---


# Find the bottleneck  -  what's stuck?
**Use when:** Clustered evidence + hypothesis + proposed owner.
**What it does:** I cluster evidence from your reviews, decisions, anomalies, and off-track KRs into named bottlenecks  -  each with a hypothesis and a proposed owner to unblock.
**Outcome:** Entries in bottlenecks.json with hypotheses + proposed owners.
## Instructions
Run this as a user-facing action. Use the underlying `identify-bottleneck` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Tell me what's stuck. Use the identify-bottleneck skill. Cluster evidence from recent weekly reviews, open decisions, open anomalies, off-track OKRs, and bounced follow-ups. Produce 1-3 named bottlenecks each with a hypothesis and a proposed owner to unblock. Append to bottlenecks.json.
```
