---
name: mine-the-tickets-for-what-customers-are-actually-saying
description: "I cluster the last 30 days of conversations + feature requests into top 5 pains, top 5 asks, friction phrases that contradict your positioning, and landing-page-ready quotes with attribution."
version: 1
tags: ["support", "overview-action", "synthesize-voice-of-customer"]
category: "Quality"
featured: yes
integrations: ["gmail"]
image: "headphone"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Mine the last 30 days of tickets for voice-of-customer signal. Use the synthesize-voice-of-customer skill. Cluster conversations.json + requests.json + patterns.json for the window into top 5 pains (verbatim quotes), top 5 feature asks (distinct requesters), friction quotes that contradict positioning, and positioning-worthy quotes. Save to voc/{{date}}.md.
---


# Mine the tickets for what customers are actually saying
**Use when:** Pains, asks, friction quotes, positioning wedges.
**What it does:** I cluster the last 30 days of conversations + feature requests into top 5 pains, top 5 asks, friction phrases that contradict your positioning, and landing-page-ready quotes with attribution.
**Outcome:** Synthesis at `voc/{date}.md`  -  the single best source for roadmap + landing-page updates.
## Instructions
Run this as a user-facing action. Use the underlying `synthesize-voice-of-customer` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Mine the last 30 days of tickets for voice-of-customer signal. Use the synthesize-voice-of-customer skill. Cluster conversations.json + requests.json + patterns.json for the window into top 5 pains (verbatim quotes), top 5 feature asks (distinct requesters), friction quotes that contradict positioning, and positioning-worthy quotes. Save to voc/{YYYY-MM-DD}.md.
```
