---
name: the-monday-sales-health-review
description: "I aggregate last week's outputs across Playbook, Outbound, Inbound, Meetings, CRM, and Retention from outputs.json, flag what's stalled, and recommend the top 3 moves. A 2-minute scan."
version: 1
tags: ["sales", "overview-action", "analyze"]
category: "Playbook"
featured: yes
integrations: ["hubspot", "salesforce", "attio", "gong", "fireflies"]
image: "handshake"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Give me the Monday sales review. Use the analyze skill with subject=sales-health. Aggregate everything this agent produced last week from outputs.json (leads, calls, outreach, proposals, QBRs, scores, forecasts), group by domain, flag stalled work + missed followups, and recommend the top 3 moves for the week. Save to analyses/sales-health-{{date}}.md.
---


# The Monday sales health review
**Use when:** What shipped, what's stalled, top 3 moves.
**What it does:** I aggregate last week's outputs across Playbook, Outbound, Inbound, Meetings, CRM, and Retention from outputs.json, flag what's stalled, and recommend the top 3 moves. A 2-minute scan.
**Outcome:** Review at analyses/sales-health-{date}.md with top 3 moves across all domains.
## Instructions
Run this as a user-facing action. Use the underlying `analyze` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Give me the Monday sales review. Use the analyze skill with subject=sales-health. Aggregate everything this agent produced last week from outputs.json (leads, calls, outreach, proposals, QBRs, scores, forecasts), group by domain, flag stalled work + missed followups, and recommend the top 3 moves for the week. Save to analyses/sales-health-{YYYY-MM-DD}.md.
```
