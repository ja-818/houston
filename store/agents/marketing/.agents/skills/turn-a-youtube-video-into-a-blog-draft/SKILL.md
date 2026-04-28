---
name: turn-a-youtube-video-into-a-blog-draft
description: "I fetch the transcript via YouTube and rewrite as a long-form blog draft with SEO structure. Great for conference talks, founder interviews, live sessions."
version: 1
tags: ["marketing", "overview-action", "repurpose-content"]
category: "SEO"
featured: yes
integrations: ["linkedin", "twitter", "youtube", "firecrawl"]
image: "megaphone"
---


# Turn a YouTube video into a blog draft
**Use when:** Transcript → long-form SEO-structured draft.
**What it does:** I fetch the transcript via YouTube and rewrite as a long-form blog draft with SEO structure. Great for conference talks, founder interviews, live sessions.
**Outcome:** Draft at repurposed/{video}-to-blog.md.
## Instructions
Run this as a user-facing action. Use the underlying `repurpose-content` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Turn {YouTube URL} into a blog post draft. Use the repurpose-content skill. Fetch the transcript via YouTube (Composio) and rewrite as a long-form blog draft with SEO structure (H1/H2, keywords, meta). Great for founder interviews, conference talks, or live sessions. Save to repurposed/{video-slug}-to-blog.md.
```
