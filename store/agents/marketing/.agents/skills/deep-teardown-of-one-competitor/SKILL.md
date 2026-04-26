---
name: deep-teardown-of-one-competitor
description: "One competitor, all dimensions via web scrape: positioning, pricing, content strategy, messaging patterns, unguarded flanks to attack."
version: 1
tags: ["marketing", "overview-action", "monitor-competitors"]
category: "Positioning"
featured: yes
integrations: ["linkedin", "twitter", "reddit", "instagram", "googleads", "metaads", "firecrawl"]
image: "megaphone"
inputs:
  - name: competitor
    label: "Competitor"
  - name: competitor_slug
    label: "Competitor Slug"
    required: false
prompt_template: |
  Do a full teardown of {{competitor}}. Use the monitor-competitors skill with source=product. Go deep on all dimensions via Firecrawl: positioning statement, pricing page, content strategy, messaging patterns, unguarded flanks we should press. Save to competitor-briefs/product-{{competitor_slug}}.md.
---


# Deep teardown of one competitor
**Use when:** Positioning, pricing, content, where we can press.
**What it does:** One competitor, all dimensions via web scrape: positioning, pricing, content strategy, messaging patterns, unguarded flanks to attack.
**Outcome:** Teardown at competitor-briefs/product-{competitor}.md. Send it to the paid campaign skill for ad angles.
## Instructions
Run this as a user-facing action. Use the underlying `monitor-competitors` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Do a full teardown of {competitor}. Use the monitor-competitors skill with source=product. Go deep on all dimensions via Firecrawl: positioning statement, pricing page, content strategy, messaging patterns, unguarded flanks we should press. Save to competitor-briefs/product-{competitor-slug}.md.
```
