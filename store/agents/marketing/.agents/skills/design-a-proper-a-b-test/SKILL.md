---
name: design-a-proper-a-b-test
description: "Full spec: hypothesis (PICOT), control vs variant, primary + secondary metrics, sample-size estimate with MDE + power, duration, go/no-go criteria."
version: 1
tags: ["marketing", "overview-action", "design-ab-test"]
category: "Paid"
featured: yes
integrations: ["ahrefs", "airtable", "attio", "customerio", "firecrawl", "fireflies", "gong", "googleads", "googledocs", "hubspot", "instagram", "linkedin", "mailchimp", "metaads", "notion", "perplexityai", "reddit", "salesforce", "semrush", "stripe", "twitter", "youtube"]
image: "megaphone"
inputs:
  - name: slug
    label: "Slug"
    required: false
prompt_template: |
  Design an A/B test for the pricing page headline. Use the design-ab-test skill. Full spec: hypothesis (PICOT), control vs variant, primary + secondary metrics, sample-size estimate with MDE + power, duration, go/no-go criteria. Save to ab-tests/{{slug}}.md so I don't ship the loser.
---


# Design a proper A/B test
**Use when:** Hypothesis, MDE, power, go/no-go  -  no coin flip.
**What it does:** Full spec: hypothesis (PICOT), control vs variant, primary + secondary metrics, sample-size estimate with MDE + power, duration, go/no-go criteria.
**Outcome:** Test spec at ab-tests/{slug}.md. Paste into your experimentation tool.
## Instructions
Run this as a user-facing action. Use the underlying `design-ab-test` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Design an A/B test for the pricing page headline. Use the design-ab-test skill. Full spec: hypothesis (PICOT), control vs variant, primary + secondary metrics, sample-size estimate with MDE + power, duration, go/no-go criteria. Save to ab-tests/{slug}.md so I don't ship the loser.
```
