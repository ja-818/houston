---
name: queue-a-follow-up-task-for-a-deal
description: "I push a task into your connected task tool (Linear / Notion / Asana-style) - who, what, when, linked deal - and log it locally."
version: 1
tags: ["sales", "overview-action", "manage-crm"]
category: "CRM"
featured: yes
integrations: ["hubspot", "salesforce", "attio", "pipedrive", "notion", "linear"]
image: "handshake"
---


# Queue a follow-up task for a deal
**Use when:** Push to Linear / Notion / Asana  -  who, what, when.
**What it does:** I push a task into your connected task tool (Linear / Notion / Asana-style)  -  who, what, when, linked deal  -  and log it locally.
**Outcome:** Task pushed + logged to tasks/{date}.md with the task URL.
## Instructions
Run this as a user-facing action. Use the underlying `manage-crm` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Queue a follow-up on {Acme} for {date}. Use the manage-crm skill with action=queue-followup. Parse who + what + when from the ask, push the task into my connected task tool (Linear / Notion / Asana-style via Composio), and log to tasks/{YYYY-MM-DD}.md. Capture the task URL.
```
