---
name: mine-your-sales-calls-for-real-customer-language
description: "Pull transcripts from your connected call-recording app (Gong / Fireflies), extract verbatim customer phrases, rank pains by frequency, flag positioning wedges."
version: 1
tags: ["marketing", "overview-action", "mine-sales-calls"]
category: "Positioning"
featured: yes
integrations: ["gong", "fireflies"]
image: "megaphone"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Mine my last 10 sales calls from my connected call-recording app (Gong / Fireflies via Composio) for positioning signals. Use the mine-sales-calls skill. Extract verbatim customer phrases, rank pains by frequency, surface objection patterns, and flag positioning wedges. Save to call-insights/{{date}}.md.
---


# Mine your sales calls for real customer language
**Use when:** Verbatim pains + objections + positioning wedges.
**What it does:** Pull transcripts from your connected call-recording app (Gong / Fireflies), extract verbatim customer phrases, rank pains by frequency, flag positioning wedges.
**Outcome:** Insights at call-insights/{date}.md  -  the single best source for ad copy and landing-page headlines.
## Instructions
Run this as a user-facing action. Use the underlying `mine-sales-calls` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Mine my last 10 sales calls from my connected call-recording app (Gong / Fireflies via Composio) for positioning signals. Use the mine-sales-calls skill. Extract verbatim customer phrases, rank pains by frequency, surface objection patterns, and flag positioning wedges. Save to call-insights/{YYYY-MM-DD}.md.
```
