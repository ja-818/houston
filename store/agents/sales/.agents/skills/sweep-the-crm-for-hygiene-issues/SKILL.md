---
name: sweep-the-crm-for-hygiene-issues
description: "I detect dupes, missing required fields, stale deals, and stage mismatches (deal in Stage N with Stage N-1 exit criteria unmet) in your connected CRM. Nothing mutates until you approve per row."
version: 1
tags: ["sales", "overview-action", "manage-crm"]
category: "CRM"
featured: yes
integrations: ["hubspot", "salesforce", "attio", "pipedrive", "notion", "linear"]
image: "handshake"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Sweep my CRM for hygiene issues. Use the manage-crm skill with action=clean. Pull the full contact + deal list from my connected CRM (HubSpot / Salesforce / Attio / Pipedrive / Close via Composio). Detect dupes, missing required fields (per the playbook's qualification framework), stage mismatches, and stale deals. Write the diff list to crm-reports/clean-{{date}}.md. I wait for per-row approval before mutating.
---


# Sweep the CRM for hygiene issues
**Use when:** Dupes · missing fields · stage mismatches.
**What it does:** I detect dupes, missing required fields, stale deals, and stage mismatches (deal in Stage N with Stage N-1 exit criteria unmet) in your connected CRM. Nothing mutates until you approve per row.
**Outcome:** Diff list at crm-reports/clean-{date}.md awaiting per-row approval.
## Instructions
Run this as a user-facing action. Use the underlying `manage-crm` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Sweep my CRM for hygiene issues. Use the manage-crm skill with action=clean. Pull the full contact + deal list from my connected CRM (HubSpot / Salesforce / Attio / Pipedrive / Close via Composio). Detect dupes, missing required fields (per the playbook's qualification framework), stage mismatches, and stale deals. Write the diff list to crm-reports/clean-{YYYY-MM-DD}.md. I wait for per-row approval before mutating.
```
