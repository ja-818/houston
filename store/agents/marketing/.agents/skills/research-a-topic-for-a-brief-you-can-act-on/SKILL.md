---
name: research-a-topic-for-a-brief-you-can-act-on
description: "Deep research via Exa (or Perplexity / Firecrawl fallback). Structured brief with cited sources and 3–5 angles worth writing about."
version: 1
tags: ["marketing", "overview-action", "synthesize-research"]
category: "Positioning"
featured: yes
integrations: ["firecrawl", "perplexityai"]
image: "megaphone"
---


# Research a topic for a brief you can act on
**Use when:** Exa-powered deep research with sources cited.
**What it does:** Deep research via Exa (or Perplexity / Firecrawl fallback). Structured brief with cited sources and 3–5 angles worth writing about.
**Outcome:** Brief at research/{slug}.md. Hand to the write-content or write-page-copy skills for drafting.
## Instructions
Run this as a user-facing action. Use the underlying `synthesize-research` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Research {topic} with Exa and give me a structured brief. Use the synthesize-research skill. Deep research via connected Exa (or Perplexity / Firecrawl fallback), cite sources, and deliver key findings + 3–5 angles worth writing about. Save to research/{slug}.md so downstream content / ad / landing-page skills can pull from it.
```
