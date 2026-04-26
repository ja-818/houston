---
name: draft-the-engineering-context-every-other-skill-reads-first
description: "I walk you through a short interview (or read your connected GitHub) and draft the full engineering context doc - product, stack, architecture, quality bar, team, priorities, conventions. Every other skill in this agent reads it first."
version: 1
tags: ["engineering", "overview-action", "define-engineering-context"]
category: "Planning"
featured: yes
integrations: ["github", "gitlab", "linear", "jira"]
image: "laptop"
inputs:
  - name: request
    label: "Additional context"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Help me draft (or update) my engineering context doc. Use the define-engineering-context skill. Interview me briefly (or read my connected GitHub) and write the full doc  -  product, stack, architecture, quality bar, team shape, current priorities, conventions  -  to context/engineering-context.md. Every other skill reads this first; until it exists, they stop and ask for it.

  Additional context: {{request}}
---


# Draft the engineering context every other skill reads first
**Use when:** Product, stack, architecture, quality bar, priorities.
**What it does:** I walk you through a short interview (or read your connected GitHub) and draft the full engineering context doc  -  product, stack, architecture, quality bar, team, priorities, conventions. Every other skill in this agent reads it first.
**Outcome:** A locked engineering context at context/engineering-context.md. Every skill that plans, reviews, audits, or documents reads it.
## Instructions
Run this as a user-facing action. Use the underlying `define-engineering-context` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Help me draft (or update) my engineering context doc. Use the define-engineering-context skill. Interview me briefly (or read my connected GitHub) and write the full doc  -  product, stack, architecture, quality bar, team shape, current priorities, conventions  -  to context/engineering-context.md. Every other skill reads this first; until it exists, they stop and ask for it.
```
