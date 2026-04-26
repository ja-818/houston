---
name: weekly-funnel-readout-find-the-leak
description: "Compute conversion at each step (from your connected PostHog / Mixpanel / GA4, or paste), flag the biggest drop, recommend 2–3 experiments by lift × effort."
version: 1
tags: ["marketing", "overview-action", "analyze"]
category: "Paid"
featured: yes
integrations: ["linkedin", "firecrawl", "semrush"]
image: "megaphone"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Give me the weekly funnel readout. Use the analyze skill with subject=funnel. Compute conversion at each step from my connected PostHog / Mixpanel / GA4 (or paste), flag the biggest drop, and recommend 2–3 experiments ranked by expected lift × effort. Save to analyses/funnel-{{date}}.md  -  clear next actions, not a dashboard dump.
---


# Weekly funnel readout  -  find the leak
**Use when:** Biggest drop + 2-3 experiments ranked by lift × effort.
**What it does:** Compute conversion at each step (from your connected PostHog / Mixpanel / GA4, or paste), flag the biggest drop, recommend 2–3 experiments by lift × effort.
**Outcome:** Review at analyses/funnel-{date}.md  -  clear next actions, not a dashboard dump.
## Instructions
Run this as a user-facing action. Use the underlying `analyze` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Give me the weekly funnel readout. Use the analyze skill with subject=funnel. Compute conversion at each step from my connected PostHog / Mixpanel / GA4 (or paste), flag the biggest drop, and recommend 2–3 experiments ranked by expected lift × effort. Save to analyses/funnel-{YYYY-MM-DD}.md  -  clear next actions, not a dashboard dump.
```
