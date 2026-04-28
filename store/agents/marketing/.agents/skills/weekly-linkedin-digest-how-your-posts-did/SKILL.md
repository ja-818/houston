---
name: weekly-linkedin-digest-how-your-posts-did
description: "Stats on your own posts (reach, engagement, new followers) plus notable posts in your network worth commenting on. 5-minute read."
version: 1
tags: ["marketing", "overview-action", "digest-linkedin-activity"]
category: "Social"
featured: yes
integrations: ["linkedin"]
image: "megaphone"
---


# Weekly LinkedIn digest  -  how your posts did
**Use when:** Your stats + notable network posts worth commenting on.
**What it does:** Stats on your own posts (reach, engagement, new followers) plus notable posts in your network worth commenting on. 5-minute read.
**Outcome:** Digest at linkedin-digests/{date}.md for Monday morning.
## Instructions
Run this as a user-facing action. Use the underlying `digest-linkedin-activity` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Give me the weekly LinkedIn digest. Use the digest-linkedin-activity skill. Pull stats on my own posts (reach, engagement, new followers) via my connected LinkedIn plus notable posts in my network worth commenting on. A 5-minute read. Save to linkedin-digests/{YYYY-MM-DD}.md for Monday morning.
```
