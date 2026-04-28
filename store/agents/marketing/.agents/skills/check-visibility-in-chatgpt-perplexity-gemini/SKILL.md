---
name: check-visibility-in-chatgpt-perplexity-gemini
description: "I probe AI search engines for your brand and category terms, then recommend GEO (Generative Engine Optimization) changes: schema, mentions, source authority, content tweaks."
version: 1
tags: ["marketing", "overview-action", "audit"]
category: "SEO"
featured: yes
integrations: ["firecrawl", "semrush", "ahrefs", "perplexityai"]
image: "megaphone"
---


# Check visibility in ChatGPT, Perplexity, Gemini
**Use when:** GEO audit: schema, mentions, source authority.
**What it does:** I probe AI search engines for your brand and category terms, then recommend GEO (Generative Engine Optimization) changes: schema, mentions, source authority, content tweaks.
**Outcome:** AI-search audit at audits/ai-search-{date}.md with concrete content + schema changes.
## Instructions
Run this as a user-facing action. Use the underlying `audit` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
How does my product show up in ChatGPT, Perplexity, and Gemini? Use the audit skill with surface=ai-search. Probe AI engines for my brand and category terms, then recommend Generative Engine Optimization (GEO) changes  -  schema, mentions, source authority, content tweaks. Save to audits/ai-search-{YYYY-MM-DD}.md.
```
