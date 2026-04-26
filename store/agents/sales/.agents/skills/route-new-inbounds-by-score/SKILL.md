---
name: route-new-inbounds-by-score
description: "I read the latest lead scores, apply your routing policy (GREEN → assign, YELLOW → nurture, RED → drop), and write the decisions. No CRM mutations until you approve per row."
version: 1
tags: ["sales", "overview-action", "manage-crm"]
category: "Inbound"
featured: yes
integrations: ["hubspot", "salesforce", "attio", "pipedrive", "notion", "linear"]
image: "handshake"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Route my new inbounds. Use the manage-crm skill with action=route. Read the latest scores from scores/lead-*.md (or run the score skill first if stale), apply the playbook's routing policy (GREEN → assign to owner, YELLOW → nurture queue, RED → drop with disqualifier cited), and write the routing decisions to crm-reports/route-{{date}}.md. I wait for per-row approval before mutating the CRM.
---


# Route new inbounds by score
**Use when:** GREEN → assign, YELLOW → nurture, RED → drop.
**What it does:** I read the latest lead scores, apply your routing policy (GREEN → assign, YELLOW → nurture, RED → drop), and write the decisions. No CRM mutations until you approve per row.
**Outcome:** Routing decisions at crm-reports/route-{date}.md awaiting approval.
## Instructions
Run this as a user-facing action. Use the underlying `manage-crm` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Route my new inbounds. Use the manage-crm skill with action=route. Read the latest scores from scores/lead-*.md (or run the score skill first if stale), apply the playbook's routing policy (GREEN → assign to owner, YELLOW → nurture queue, RED → drop with disqualifier cited), and write the routing decisions to crm-reports/route-{YYYY-MM-DD}.md. I wait for per-row approval before mutating the CRM.
```
