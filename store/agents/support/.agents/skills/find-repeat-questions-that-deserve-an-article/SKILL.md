---
name: find-repeat-questions-that-deserve-an-article
description: "I scan the last 30-60 days, cluster semantically similar asks, and for each cluster ≥3 without a matching article, append to `patterns.json`. Offers to chain into `write-article` for the top pick."
version: 1
tags: ["support", "overview-action", "detect-signal"]
category: "Help Center"
featured: yes
integrations: ["gmail", "github", "linear", "jira"]
image: "headphone"
---


# Find repeat questions that deserve an article
**Use when:** Clusters ≥3 without a matching KB entry.
**What it does:** I scan the last 30-60 days, cluster semantically similar asks, and for each cluster ≥3 without a matching article, append to `patterns.json`. Offers to chain into `write-article` for the top pick.
**Outcome:** Clusters in `patterns.json`  -  the docs you should write first.
## Instructions
Run this as a user-facing action. Use the underlying `detect-signal` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Find repeat-question clusters that deserve an article. Use the detect-signal skill with signal=repeat-question. Scan the last 30-60 days of conversations.json, cluster semantically similar incoming questions, and for each cluster of ≥3 with no matching article in articles/, append to patterns.json. Offer to chain write-article type=from-ticket for my top pick.
```
