---
name: triage-an-inbound-ticket-against-your-routing-rules
description: "I pull the thread via your connected inbox (Gmail / Outlook / Intercom / Help Scout / Zendesk), classify against your routing rules, assign priority from tier + content signals, and VIP-flag. Writes to `conversations.json` +…"
version: 1
tags: ["support", "overview-action", "triage-incoming"]
category: "Inbox"
featured: yes
integrations: ["gmail", "outlook", "slack"]
image: "headphone"
---


# Triage an inbound ticket against your routing rules
**Use when:** Category, priority, VIP-flag, SLA  -  before you read it.
**What it does:** I pull the thread via your connected inbox (Gmail / Outlook / Intercom / Help Scout / Zendesk), classify against your routing rules, assign priority from tier + content signals, and VIP-flag. Writes to `conversations.json` + `conversations/{id}/thread.json`.
**Outcome:** Triaged entry at `conversations.json`  -  ready for `draft-reply` or `detect-signal`.
## Instructions
Run this as a user-facing action. Use the underlying `triage-incoming` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Triage this new inbound customer message. Use the triage-incoming skill. Pull the thread via my connected inbox (Gmail / Outlook / Intercom / Help Scout / Zendesk via Composio), classify against the routing rules in context/support-context.md, assign priority from customer tier + content signals, VIP-flag, and write to conversations.json + conversations/{id}/thread.json.
```
