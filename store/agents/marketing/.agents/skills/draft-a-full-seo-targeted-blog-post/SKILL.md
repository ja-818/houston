---
name: draft-a-full-seo-targeted-blog-post
description: "2,000–3,000-word draft with H1/H2/H3, meta description, URL slug, internal-link suggestions, and one clear CTA. Saved to a Google Doc if connected. Reads like you wrote it."
version: 1
tags: ["marketing", "overview-action", "write-content"]
category: "SEO"
featured: yes
integrations: ["googledocs", "linkedin", "twitter", "reddit", "mailchimp", "firecrawl"]
image: "megaphone"
---


# Draft a full SEO-targeted blog post
**Use when:** 2,000–3,000 words with meta, slug, internal links, CTA.
**What it does:** 2,000–3,000-word draft with H1/H2/H3, meta description, URL slug, internal-link suggestions, and one clear CTA. Saved to a Google Doc if connected. Reads like you wrote it.
**Outcome:** Draft at blog-posts/{slug}.md (+ Google Doc if connected). Paste into your CMS.
## Instructions
Run this as a user-facing action. Use the underlying `write-content` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft a blog post on {topic} targeting {keyword}. Use the write-content skill with channel=blog. 2,000–3,000 words with proper H1/H2/H3, meta description, URL slug, internal-link suggestions, and one clear CTA. Reads like I wrote it. Save to blog-posts/{slug}.md and also save to my connected Google Docs if one's linked.
```
