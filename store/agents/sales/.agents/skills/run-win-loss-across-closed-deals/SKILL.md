---
name: run-win-loss-across-closed-deals
description: "Cluster closed-won + closed-lost deals by reason via the connected CRM. Find the 3 repeat patterns. Propose concrete playbook edits - ICP tightening, objection handbook additions, pricing adjustments."
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
  Run win-loss across my closed deals. Use the analyze skill with subject=win-loss. Pull closed-won and closed-lost deals from my connected CRM (at least 5 of each), cluster by reason, find the 3 patterns that repeat, and propose concrete playbook edits (ICP tightening, objection handbook additions, pricing adjustments). Save to analyses/win-loss-{{date}}.md.
---


# Run win-loss across closed deals
**Use when:** Cluster won + lost deals, find 3 patterns, propose edits.
**What it does:** Cluster closed-won + closed-lost deals by reason via the connected CRM. Find the 3 repeat patterns. Propose concrete playbook edits  -  ICP tightening, objection handbook additions, pricing adjustments.
**Outcome:** Win-loss at analyses/win-loss-{date}.md with 3 playbook-edit proposals.
## Instructions
Run this as a user-facing action. Use the underlying `analyze` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Run win-loss across my closed deals. Use the analyze skill with subject=win-loss. Pull closed-won and closed-lost deals from my connected CRM (at least 5 of each), cluster by reason, find the 3 patterns that repeat, and propose concrete playbook edits (ICP tightening, objection handbook additions, pricing adjustments). Save to analyses/win-loss-{YYYY-MM-DD}.md.
```
