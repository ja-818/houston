---
name: set-up-the-shared-legal-context-doc
description: "Interviews you briefly (or pulls from Carta if connected), then writes the shared legal doc to context/legal-context.md - the source of truth every other skill in this agent reads first."
version: 1
tags: ["legal", "overview-action", "define-legal-context"]
category: "Entity"
featured: yes
integrations: ["googledocs", "notion"]
image: "scroll"
inputs:
  - name: request
    label: "Additional context"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Draft or update my shared legal context doc. Use the define-legal-context skill. Interview me briefly (or pull from my connected Carta if available), then write entity snapshot + cap table + standing agreements + template stack + open risks + risk posture to context/legal-context.md. Every other skill in this agent reads it first.

  Additional context: {{request}}
---


# Set up the shared legal context doc
**Use when:** Entity, cap table, templates, risk posture  -  one source.
**What it does:** Interviews you briefly (or pulls from Carta if connected), then writes the shared legal doc to context/legal-context.md  -  the source of truth every other skill in this agent reads first.
**Outcome:** Locked doc at context/legal-context.md. Every skill reads it before running.
## Instructions
Run this as a user-facing action. Use the underlying `define-legal-context` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft or update my shared legal context doc. Use the define-legal-context skill. Interview me briefly (or pull from my connected Carta if available), then write entity snapshot + cap table + standing agreements + template stack + open risks + risk posture to context/legal-context.md. Every other skill in this agent reads it first.
```
