---
name: broadcast-what-we-shipped-to-customers-who-asked
description: "I read `requests.json`, filter to customers who asked for exactly this, and draft a short personal note per customer referencing their specific ask. One file per customer - never a bulk blast."
version: 1
tags: ["support", "overview-action", "write-article"]
category: "Help Center"
featured: yes
integrations: ["googledocs", "notion", "github", "linear"]
image: "headphone"
---


# Broadcast what we shipped to customers who asked
**Use when:** Personalized per-customer note  -  no bulk blast.
**What it does:** I read `requests.json`, filter to customers who asked for exactly this, and draft a short personal note per customer referencing their specific ask. One file per customer  -  never a bulk blast.
**Outcome:** Per-customer drafts at `broadcasts/{date}-{slug}.md`  -  send from your own inbox.
## Instructions
Run this as a user-facing action. Use the underlying `write-article` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Broadcast that we shipped {feature}. Use the write-article skill with type=broadcast-shipped. Read requests.json, filter to customers who asked for exactly this, and draft a short personal note per customer referencing their specific ask. One file per customer in broadcasts/{YYYY-MM-DD}-{slug}.md.
```
