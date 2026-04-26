---
name: draft-the-playbook-that-anchors-every-other-output
description: "I interview you briefly and write the full playbook (ICP, buying committee, qualification framework, pricing stance, deal stages, objection handbook, competitors, primary first-call goal) to context/sales-context.md. Every other skill reads it first."
version: 1
tags: ["sales", "overview-action", "define-playbook"]
category: "Playbook"
featured: yes
integrations: ["googledocs", "hubspot", "salesforce", "attio", "pipedrive", "notion"]
image: "handshake"
inputs:
  - name: request
    label: "Additional context"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Help me write my full sales playbook: ICP, buying committee, disqualifiers, qualification framework (MEDDPICC / BANT / custom), pricing stance, deal stages with exit criteria, objection handbook, top 3 competitors, primary first-call goal. Use the define-playbook skill. Interview me briefly, then write to context/sales-context.md  -  the source of truth every other skill in this agent reads before it drafts outreach, preps calls, or scores deals.

  Additional context: {{request}}
---


# Draft the playbook that anchors every other output
**Use when:** ICP, buying committee, qualification, pricing, stages, objections.
**What it does:** I interview you briefly and write the full playbook (ICP, buying committee, qualification framework, pricing stance, deal stages, objection handbook, competitors, primary first-call goal) to context/sales-context.md. Every other skill reads it first.
**Outcome:** A locked playbook at context/sales-context.md  -  every skill that drafts outreach, preps calls, or scores deals reads it first.
## Instructions
Run this as a user-facing action. Use the underlying `define-playbook` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Help me write my full sales playbook: ICP, buying committee, disqualifiers, qualification framework (MEDDPICC / BANT / custom), pricing stance, deal stages with exit criteria, objection handbook, top 3 competitors, primary first-call goal. Use the define-playbook skill. Interview me briefly, then write to context/sales-context.md  -  the source of truth every other skill in this agent reads before it drafts outreach, preps calls, or scores deals.
```
