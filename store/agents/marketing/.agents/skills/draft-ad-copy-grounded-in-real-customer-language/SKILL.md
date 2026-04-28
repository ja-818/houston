---
name: draft-ad-copy-grounded-in-real-customer-language
description: "I pull phrases from your call insights (or G2 / Capterra / Trustpilot reviews via scrape) and write headlines + descriptions that sound like your customers talking - not a marketer pitching."
version: 1
tags: ["marketing", "overview-action", "generate-ad-copy"]
category: "Paid"
featured: yes
integrations: ["linkedin", "reddit", "firecrawl"]
image: "megaphone"
---


# Draft ad copy grounded in real customer language
**Use when:** 10 variants with the source quote next to each.
**What it does:** I pull phrases from your call insights (or G2 / Capterra / Trustpilot reviews via scrape) and write headlines + descriptions that sound like your customers talking  -  not a marketer pitching.
**Outcome:** Variants at ad-copy/{campaign}.md with the source quote alongside each headline.
## Instructions
Run this as a user-facing action. Use the underlying `generate-ad-copy` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft 10 ad variants grounded in real customer language. Use the generate-ad-copy skill. Pull phrases from my call-insights/ folder (or G2 / Capterra / Trustpilot reviews via scrape) and write headlines + descriptions that sound like my customers talking, not a marketer pitching. Save to ad-copy/{campaign-slug}.md with the source quote alongside each headline.
```
