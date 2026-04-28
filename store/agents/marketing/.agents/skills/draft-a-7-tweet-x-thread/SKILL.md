---
name: draft-a-7-tweet-x-thread
description: "Hook tweet, numbered progression, CTA tweet at the end. Each tweet fits the 280-char budget with room for edits."
version: 1
tags: ["marketing", "overview-action", "write-content"]
category: "Social"
featured: yes
integrations: ["googledocs", "linkedin", "twitter", "reddit", "mailchimp", "firecrawl"]
image: "megaphone"
---


# Draft a 7-tweet X thread
**Use when:** Hook + numbered progression + CTA. 280 chars each.
**What it does:** Hook tweet, numbered progression, CTA tweet at the end. Each tweet fits the 280-char budget with room for edits.
**Outcome:** Thread at threads/x-{slug}.md  -  copy tweet-by-tweet into your scheduler.
## Instructions
Run this as a user-facing action. Use the underlying `write-content` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft a 7-tweet X thread on {topic}. Use the write-content skill with channel=x-thread. Hook tweet, numbered progression, CTA tweet at the end. Each tweet fits the 280-char budget with room for edits. Save to threads/x-{slug}.md.
```
