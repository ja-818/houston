---
name: weekly-competitor-pulse-across-3-rivals
description: "I scan each competitor's blog, product updates, and pricing via Firecrawl. Single-competitor teardown or N-competitor weekly digest, filtered for real threats vs noise."
version: 1
tags: ["marketing", "overview-action", "monitor-competitors"]
category: "Positioning"
featured: yes
integrations: ["linkedin", "twitter", "reddit", "instagram", "googleads", "metaads", "firecrawl"]
image: "megaphone"
inputs:
  - name: competitor_a
    label: "Competitor A"
    placeholder: "First competitor"
  - name: competitor_b
    label: "Competitor B"
    placeholder: "Second competitor"
  - name: competitor_c
    label: "Competitor C"
    placeholder: "Third competitor"
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Give me this week's competitor pulse across {{competitor_a}}, {{competitor_b}}, {{competitor_c}}. Use the monitor-competitors skill with source=product. Scan each competitor's recent blog posts, product updates, release notes, and pricing pages via Firecrawl. Filter real threats from noise. Save to competitor-briefs/product-weekly-{{date}}.md.
---


# Weekly competitor pulse across 3 rivals
**Use when:** Blog + product + ads + social. Threats vs noise.
**What it does:** I scan each competitor's blog, product updates, and pricing via Firecrawl. Single-competitor teardown or N-competitor weekly digest, filtered for real threats vs noise.
**Outcome:** Weekly digest at competitor-briefs/product-weekly-{YYYY-MM-DD}.md  -  moves to respond to + ignore list.
## Instructions
Run this as a user-facing action. Use the underlying `monitor-competitors` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Give me this week's competitor pulse across {Competitor A}, {Competitor B}, {Competitor C}. Use the monitor-competitors skill with source=product. Scan each competitor's recent blog posts, product updates, release notes, and pricing pages via Firecrawl. Filter real threats from noise. Save to competitor-briefs/product-weekly-{YYYY-MM-DD}.md.
```
