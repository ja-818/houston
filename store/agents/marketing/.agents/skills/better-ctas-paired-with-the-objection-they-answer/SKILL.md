---
name: better-ctas-paired-with-the-objection-they-answer
description: "CTA button copy variants, each paired with the objection it answers (e.g. 'Start free - no credit card required'). Grounded in pains from your call insights."
version: 1
tags: ["marketing", "overview-action", "write-cta-variants"]
category: "Copy"
featured: yes
integrations: ["ahrefs", "airtable", "attio", "customerio", "firecrawl", "fireflies", "gong", "googleads", "googledocs", "hubspot", "instagram", "linkedin", "mailchimp", "metaads", "notion", "perplexityai", "reddit", "salesforce", "semrush", "stripe", "twitter", "youtube"]
image: "megaphone"
---


# Better CTAs paired with the objection they answer
**Use when:** 'Start free  -  no credit card' = CTA + objection.
**What it does:** CTA button copy variants, each paired with the objection it answers (e.g. 'Start free  -  no credit card required'). Grounded in pains from your call insights.
**Outcome:** Variants at cta-variants/{page}.md.
## Instructions
Run this as a user-facing action. Use the underlying `write-cta-variants` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Give me CTA variants for {button}. Use the write-cta-variants skill. Each variant paired with the objection it answers. Grounded in pains from my call-insights/. Save to cta-variants/{page-slug}.md.
```
