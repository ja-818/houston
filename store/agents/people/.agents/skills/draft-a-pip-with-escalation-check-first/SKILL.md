---
name: draft-a-pip-with-escalation-check-first
description: "Runs the escalation check (protected class + pretextual timing) BEFORE drafting. If it fires, stops and routes to a lawyer. If clear, drafts Context / Expectations / 30-60-90 Milestones / Support / Consequences."
version: 1
tags: ["people", "overview-action", "draft-performance-doc"]
category: "Performance"
featured: yes
integrations: ["gmail", "slack"]
image: "busts-in-silhouette"
inputs:
  - name: employee
    label: "Employee"
  - name: employee_slug
    label: "Employee Slug"
    required: false
prompt_template: |
  Draft a PIP for {{employee}}. Use the draft-performance-doc skill with type=pip. Run the MANDATORY escalation check against context/people-context.md's escalation rules FIRST. If a protected-class + pretextual-timing trigger fires, STOP and write an escalation note routing to a human lawyer. If clear, draft Context → Expectations → 30/60/90 Milestones → Support → Consequences, tied to the leveling framework. Write to performance-docs/pip-{{employee_slug}}.md as status draft. Never delivered without my sign-off.
---


# Draft a PIP (with escalation check first)
**Use when:** Context · Expectations · 30/60/90 · Support · Consequences.
**What it does:** Runs the escalation check (protected class + pretextual timing) BEFORE drafting. If it fires, stops and routes to a lawyer. If clear, drafts Context / Expectations / 30-60-90 Milestones / Support / Consequences.
**Outcome:** PIP draft (or escalation note) at performance-docs/pip-{slug}.md. Escalation classification in outputs.json.
## Instructions
Run this as a user-facing action. Use the underlying `draft-performance-doc` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft a PIP for {employee}. Use the draft-performance-doc skill with type=pip. Run the MANDATORY escalation check against context/people-context.md's escalation rules FIRST. If a protected-class + pretextual-timing trigger fires, STOP and write an escalation note routing to a human lawyer. If clear, draft Context → Expectations → 30/60/90 Milestones → Support → Consequences, tied to the leveling framework. Write to performance-docs/pip-{employee-slug}.md as status draft. Never delivered without my sign-off.
```
