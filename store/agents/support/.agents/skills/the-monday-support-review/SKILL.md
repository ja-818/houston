---
name: the-monday-support-review
description: "I read `outputs.json` filtered to the last 7 days, group by domain, count + 1-line headline + 1 unresolved per domain. Ends with 2-3 things I recommend you do this week - grounded in real output IDs."
version: 1
tags: ["support", "overview-action", "review"]
category: "Quality"
featured: yes
integrations: ["googledocs", "notion", "slack"]
image: "headphone"
---


# The Monday support review
**Use when:** What shipped, what's stuck, what to do this week.
**What it does:** I read `outputs.json` filtered to the last 7 days, group by domain, count + 1-line headline + 1 unresolved per domain. Ends with 2-3 things I recommend you do this week  -  grounded in real output IDs.
**Outcome:** Review at `reviews/{date}.md`. 2-minute scan.
## Instructions
Run this as a user-facing action. Use the underlying `review` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Give me the Monday support review. Use the review skill with scope=weekly. Read outputs.json filtered to the last 7 days, group by domain (Inbox / Help Center / Success / Quality), count + 1-line headline + 1 unresolved per domain. Read followups.json for this week and churn-flags.json opened this week. End with '2-3 things I recommend you do this week.' Save to reviews/{YYYY-MM-DD}.md.
```
