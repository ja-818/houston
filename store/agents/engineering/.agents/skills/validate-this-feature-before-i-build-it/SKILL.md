---
name: validate-this-feature-before-i-build-it
description: "I scrape competitor activity via Firecrawl and web search, assess alignment to observable demand, and produce a verdict + evidence - so feature bets stop being shower thoughts."
version: 1
tags: ["engineering", "overview-action", "validate-feature-fit"]
category: "Planning"
featured: yes
integrations: ["slack", "twitter", "firecrawl", "perplexityai"]
image: "laptop"
inputs:
  - name: feature
    label: "Feature"
  - name: slug
    label: "Slug"
    required: false
prompt_template: |
  Validate {{feature}} before I commit roadmap effort. Use the validate-feature-fit skill. I'll give you the idea, the target audience, and the problem statement. Scrape the competitor landscape via Firecrawl + Exa, check what's already shipping for this audience, and pull any adjacent customer-language signal you can find. Produce a verdict (build / defer / skip) with evidence. Save to feature-fit/{{slug}}.md. Flag the assumptions you couldn't test from the desk.
---


# Validate this feature before I build it
**Use when:** Market-fit gate with evidence before a roadmap commit.
**What it does:** I scrape competitor activity via Firecrawl and web search, assess alignment to observable demand, and produce a verdict + evidence  -  so feature bets stop being shower thoughts.
**Outcome:** A verdict at feature-fit/{slug}.md with evidence. Forward to plan-roadmap if it's a go.
## Instructions
Run this as a user-facing action. Use the underlying `validate-feature-fit` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Validate {feature} before I commit roadmap effort. Use the validate-feature-fit skill. I'll give you the idea, the target audience, and the problem statement. Scrape the competitor landscape via Firecrawl + Exa, check what's already shipping for this audience, and pull any adjacent customer-language signal you can find. Produce a verdict (build / defer / skip) with evidence. Save to feature-fit/{slug}.md. Flag the assumptions you couldn't test from the desk.
```
