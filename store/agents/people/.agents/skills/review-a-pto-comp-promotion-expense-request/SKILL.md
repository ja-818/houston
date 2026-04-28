---
name: review-a-pto-comp-promotion-expense-request
description: "Reads the approval rubric from your context doc, evaluates the request, classifies approved / escalate / denied. Escalation notes explain the trigger."
version: 1
tags: ["people", "overview-action", "run-approval-flow"]
category: "Compliance"
featured: yes
integrations: ["notion", "slack"]
image: "busts-in-silhouette"
---


# Review a PTO / comp / promotion / expense request
**Use when:** Rubric-scored approval, clean escalation notes.
**What it does:** Reads the approval rubric from your context doc, evaluates the request, classifies approved / escalate / denied. Escalation notes explain the trigger.
**Outcome:** Decision draft at approvals/{slug}.md. Flip to ready after you sign off.
## Instructions
Run this as a user-facing action. Use the underlying `run-approval-flow` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Review this {type} request: {details}. Use the run-approval-flow skill. Read the approval rubric from context/people-context.md, evaluate the request, classify as approved / escalate / denied with reasoning, and produce an escalation note for any out-of-rubric ask. Write to approvals/{request-slug}.md.
```
