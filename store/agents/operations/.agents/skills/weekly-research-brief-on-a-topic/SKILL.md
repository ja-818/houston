---
name: weekly-research-brief-on-a-topic
description: "News + research + social synthesis via Exa / Perplexity / Firecrawl. Structured brief with what's moving, who's moving it, implications, and angles - every claim cited."
version: 1
tags: ["operations", "overview-action", "synthesize-signal"]
category: "Data"
featured: yes
integrations: ["linkedin", "firecrawl", "perplexityai"]
image: "clipboard"
inputs:
  - name: topic
    label: "Topic"
  - name: slug
    label: "Slug"
    required: false
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Give me a research brief on {{topic}}. Use the synthesize-signal skill. News + deep research via Exa / Perplexity + social-feed scan via Firecrawl. Structured brief: what's moving, who's moving it, 3 implications for my company, 3 angles worth acting on. Every claim cited with source URL. Save to signals/{{slug}}-{{date}}.md.
---


# Weekly research brief on a topic
**Use when:** News + research + social synthesis. Every claim cited.
**What it does:** News + research + social synthesis via Exa / Perplexity / Firecrawl. Structured brief with what's moving, who's moving it, implications, and angles  -  every claim cited.
**Outcome:** Brief at signals/{slug}-{date}.md.
## Instructions
Run this as a user-facing action. Use the underlying `synthesize-signal` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Give me a research brief on {topic}. Use the synthesize-signal skill. News + deep research via Exa / Perplexity + social-feed scan via Firecrawl. Structured brief: what's moving, who's moving it, 3 implications for my company, 3 angles worth acting on. Every claim cited with source URL. Save to signals/{slug}-{YYYY-MM-DD}.md.
```
