---
name: reply-to-a-reddit-thread-the-right-way
description: "I pull the source thread (via Reddit / Firecrawl) and draft a value-first reply. Helpful first, link only if it truly belongs."
version: 1
tags: ["marketing", "overview-action", "write-content"]
category: "Social"
featured: yes
integrations: ["googledocs", "linkedin", "twitter", "reddit", "mailchimp", "firecrawl"]
image: "megaphone"
---


# Reply to a Reddit thread the right way
**Use when:** Value-first, no pitch, link only if relevant.
**What it does:** I pull the source thread (via Reddit / Firecrawl) and draft a value-first reply. Helpful first, link only if it truly belongs.
**Outcome:** Reply at community-replies/{source}.md.
## Instructions
Run this as a user-facing action. Use the underlying `write-content` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft a Reddit reply to {thread URL}. Use the write-content skill with channel=reddit. Pull the source thread via Reddit (Composio) / Firecrawl fallback, then draft a value-first reply. Helpful first, link only if it truly belongs. Save to community-replies/{source-slug}.md.
```
