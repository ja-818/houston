---
name: what-s-waiting-on-me-stale-thread-rescue
description: "I surface the threads quiet >48h where the ball is in your court, split from the threads where the customer already replied and you missed it. For each, I suggest nudge or clean-close."
version: 1
tags: ["support", "overview-action", "scan-inbox"]
category: "Inbox"
featured: yes
integrations: ["gmail", "outlook"]
image: "headphone"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Find stale threads waiting on me. Use the scan-inbox skill with scope=stale-threads. Filter conversations.json to conversations quiet > 48h with me as last responder, group by 'their turn' vs 'my turn', surface only the my-turn group as actionable, and for each suggest a nudge draft or a clean close. Write to stale-rescues/{{date}}.md.
---


# What's waiting on me  -  stale thread rescue
**Use when:** Quiet >48h with me as last responder.
**What it does:** I surface the threads quiet >48h where the ball is in your court, split from the threads where the customer already replied and you missed it. For each, I suggest nudge or clean-close.
**Outcome:** Rescue list at `stale-rescues/{date}.md`  -  clear the backlog in 10 min.
## Instructions
Run this as a user-facing action. Use the underlying `scan-inbox` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Find stale threads waiting on me. Use the scan-inbox skill with scope=stale-threads. Filter conversations.json to conversations quiet > 48h with me as last responder, group by 'their turn' vs 'my turn', surface only the my-turn group as actionable, and for each suggest a nudge draft or a clean close. Write to stale-rescues/{YYYY-MM-DD}.md.
```
