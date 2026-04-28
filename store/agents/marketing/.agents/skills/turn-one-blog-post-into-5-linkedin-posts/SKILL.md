---
name: turn-one-blog-post-into-5-linkedin-posts
description: "I extract the core ideas via Firecrawl and reshape each into a LinkedIn-native post (hook, whitespace, one clear takeaway)."
version: 1
tags: ["marketing", "overview-action", "repurpose-content"]
category: "SEO"
featured: yes
integrations: ["linkedin", "twitter", "youtube", "firecrawl"]
image: "megaphone"
---


# Turn one blog post into 5 LinkedIn posts
**Use when:** Each reshaped for LinkedIn's native format.
**What it does:** I extract the core ideas via Firecrawl and reshape each into a LinkedIn-native post (hook, whitespace, one clear takeaway).
**Outcome:** 5 drafts at repurposed/{source}-to-linkedin.md.
## Instructions
Run this as a user-facing action. Use the underlying `repurpose-content` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Turn {blog post URL} into 5 LinkedIn posts. Use the repurpose-content skill. Extract the core ideas via Firecrawl and reshape each into a LinkedIn-native post (hook, whitespace, one clear takeaway) I can copy into the write-content skill's LinkedIn channel to ship. Save to repurposed/{source-slug}-to-linkedin.md.
```
