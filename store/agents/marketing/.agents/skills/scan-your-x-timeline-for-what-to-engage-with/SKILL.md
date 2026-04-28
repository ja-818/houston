---
name: scan-your-x-timeline-for-what-to-engage-with
description: "I filter your feed for relevance to your topics and engagement opportunities, then suggest concrete replies - no more doom-scrolling for something to comment on."
version: 1
tags: ["marketing", "overview-action", "monitor-competitors"]
category: "Social"
featured: yes
integrations: ["linkedin", "twitter", "reddit", "instagram", "googleads", "metaads", "firecrawl"]
image: "megaphone"
---


# Scan your X timeline for what to engage with
**Use when:** Filtered for your topics. Suggested reply drafts.
**What it does:** I filter your feed for relevance to your topics and engagement opportunities, then suggest concrete replies  -  no more doom-scrolling for something to comment on.
**Outcome:** Digest at competitor-briefs/social-feed-x-{date}.md with reply drafts.
## Instructions
Run this as a user-facing action. Use the underlying `monitor-competitors` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Scan my X timeline and surface what's worth engaging with. Use the monitor-competitors skill with source=social-feed. Filter my feed for relevance to my topics and engagement opportunities, then suggest concrete replies  -  no doom-scrolling. Save to competitor-briefs/social-feed-x-{YYYY-MM-DD}.md with reply drafts per opportunity.
```
