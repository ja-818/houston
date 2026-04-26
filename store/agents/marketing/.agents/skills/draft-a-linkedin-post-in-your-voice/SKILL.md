---
name: draft-a-linkedin-post-in-your-voice
description: "Hook in the first line, whitespace, one clear takeaway, CTA or question. Uses your saved voice samples so it doesn't sound like AI."
version: 1
tags: ["marketing", "overview-action", "write-content"]
category: "Social"
featured: yes
integrations: ["googledocs", "linkedin", "twitter", "reddit", "mailchimp", "firecrawl"]
image: "megaphone"
inputs:
  - name: topic
    label: "Topic"
  - name: slug
    label: "Slug"
    required: false
prompt_template: |
  Draft a LinkedIn post about {{topic}} in my voice. Use the write-content skill with channel=linkedin. Hook in the first line, whitespace, one clear takeaway, CTA or question to spark replies. Uses my saved voice samples so it doesn't sound like AI. Save to posts/linkedin-{{slug}}.md.
---


# Draft a LinkedIn post in your voice
**Use when:** Hook, whitespace, takeaway, CTA  -  your voice.
**What it does:** Hook in the first line, whitespace, one clear takeaway, CTA or question. Uses your saved voice samples so it doesn't sound like AI.
**Outcome:** Draft at posts/linkedin-{slug}.md  -  paste into LinkedIn when ready.
## Instructions
Run this as a user-facing action. Use the underlying `write-content` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft a LinkedIn post about {topic} in my voice. Use the write-content skill with channel=linkedin. Hook in the first line, whitespace, one clear takeaway, CTA or question to spark replies. Uses my saved voice samples so it doesn't sound like AI. Save to posts/linkedin-{slug}.md.
```
