---
name: bulk-score-my-un-scored-leads-against-icp
description: "System-wide pass across every un-scored lead (leads.json + new-leads view in your connected CRM). Each row scored 0-3 per ICP dimension with transparent drivers - no black-box numbers."
version: 1
tags: ["sales", "overview-action", "score"]
category: "Outbound"
featured: yes
integrations: ["hubspot", "salesforce", "attio", "stripe"]
image: "handshake"
---


# Bulk-score my un-scored leads against ICP
**Use when:** Playbook + disqualifiers. GREEN / YELLOW / RED.
**What it does:** System-wide pass across every un-scored lead (leads.json + new-leads view in your connected CRM). Each row scored 0-3 per ICP dimension with transparent drivers  -  no black-box numbers.
**Outcome:** Ranked table at scores/lead-{date}.md + updated leads.json rows.
## Instructions
Run this as a user-facing action. Use the underlying `score` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Bulk-score every un-scored lead in leads.json + new leads from my connected CRM. Use the score skill with subject=lead. Compare each against the playbook's ICP + disqualifiers, drop hard-disqualifier RED, score each surviving lead 0-3 per dimension, and output GREEN / YELLOW / RED with the angle for each GREEN. Save to scores/lead-{YYYY-MM-DD}.md and update leads.json rows.
```
