---
name: rewrite-your-homepage-or-any-landing-page
description: "Full page copy grounded in your positioning and real customer language. Sections, headlines, bodies, CTAs, social-proof placement."
version: 1
tags: ["marketing", "overview-action", "write-page-copy"]
category: "Copy"
featured: yes
integrations: ["reddit", "firecrawl"]
image: "megaphone"
---


# Rewrite your homepage (or any landing page)
**Use when:** Full page copy grounded in real customer language.
**What it does:** Full page copy grounded in your positioning and real customer language. Sections, headlines, bodies, CTAs, social-proof placement.
**Outcome:** Draft at page-copy/{surface}-{slug}.md.
## Instructions
Run this as a user-facing action. Use the underlying `write-page-copy` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Write copy for {page}. Use the write-page-copy skill with surface=homepage (or pricing / about / landing). Full page copy grounded in my positioning and real customer language (from call-insights/ or G2 / Capterra reviews). Sections, headlines, bodies, CTAs, social-proof placement. Save to page-copy/homepage-{slug}.md.
```
