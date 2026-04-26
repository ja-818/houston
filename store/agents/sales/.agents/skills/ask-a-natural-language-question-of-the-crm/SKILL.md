---
name: ask-a-natural-language-question-of-the-crm
description: "I translate your question into a read-only CRM query, run it, and return the answer plus the query I ran - so you can adjust if needed. No mutations."
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
  Answer my natural-language question of the CRM. Use the manage-crm skill with action=query. Parse the question into a read-only query, run it against my connected CRM, and return the answer + the query it ran (so I can adjust). Save to crm-reports/query-{{date}}.md.
---


# Ask a natural-language question of the CRM
**Use when:** 'Deals closing this month?' → answer + query.
**What it does:** I translate your question into a read-only CRM query, run it, and return the answer plus the query I ran  -  so you can adjust if needed. No mutations.
**Outcome:** Answer + query at crm-reports/query-{date}.md.
## Instructions
Run this as a user-facing action. Use the underlying `manage-crm` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Answer my natural-language question of the CRM. Use the manage-crm skill with action=query. Parse the question into a read-only query, run it against my connected CRM, and return the answer + the query it ran (so I can adjust). Save to crm-reports/query-{YYYY-MM-DD}.md.
```
