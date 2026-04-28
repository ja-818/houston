---
name: capture-a-feature-request-with-customer-attribution
description: "I extract the ask in one sentence, attribute to the requesting customer's slug, and dedupe into `requests.json`. VIP requesters get flagged."
version: 1
tags: ["support", "overview-action", "detect-signal"]
category: "Inbox"
featured: yes
integrations: ["gmail", "github", "linear", "jira"]
image: "headphone"
---


# Capture a feature request with customer attribution
**Use when:** Dedupes into existing asks; VIPs flagged.
**What it does:** I extract the ask in one sentence, attribute to the requesting customer's slug, and dedupe into `requests.json`. VIP requesters get flagged.
**Outcome:** Entry in `requests.json`  -  surfaces in weekly reviews + 'broadcast shipped.'
## Instructions
Run this as a user-facing action. Use the underlying `detect-signal` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Capture this feature request. Use the detect-signal skill with signal=feature-request. Extract the ask in one sentence, attribute to the requesting customer's slug, dedupe against requests.json, and flag if a VIP is in the cluster. Append to requests.json.
```
