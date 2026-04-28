---
name: what-s-breaching-sla-right-now
description: "I filter `conversations.json` to open items within 2h of breach or already past, read SLA tiers from your support context, and list customer + tier + time left + next action."
version: 1
tags: ["support", "overview-action", "scan-inbox"]
category: "Inbox"
featured: yes
integrations: ["gmail", "outlook"]
image: "headphone"
---


# What's breaching SLA right now
**Use when:** Within 2h of breach or already past  -  next action each.
**What it does:** I filter `conversations.json` to open items within 2h of breach or already past, read SLA tiers from your support context, and list customer + tier + time left + next action.
**Outcome:** Report at `sla-reports/{date}.md`  -  hit the red ones first.
## Instructions
Run this as a user-facing action. Use the underlying `scan-inbox` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Scan for SLA breaches. Use the scan-inbox skill with scope=sla-breach. Filter conversations.json to open items within 2h of breach or already past, read SLA tiers from context/support-context.md, and for each list customer + tier + time left + next action. Write to sla-reports/{YYYY-MM-DD}.md.
```
