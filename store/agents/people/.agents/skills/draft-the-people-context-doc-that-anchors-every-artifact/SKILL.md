---
name: draft-the-people-context-doc-that-anchors-every-artifact
description: "I interview you briefly and write the shared doc: values, leveling (IC + manager L1-L5), comp bands, policy canon, escalation rules, voice, hard nos. Every other skill reads it first."
version: 1
tags: ["people", "overview-action", "define-people-context"]
category: "Culture"
featured: yes
integrations: ["googlesheets", "googledocs", "notion"]
image: "busts-in-silhouette"
inputs:
  - name: request
    label: "Additional context"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Draft our people-context doc. Use the define-people-context skill. Interview me briefly, then write context/people-context.md: company values, team shape, leveling framework (IC + manager L1-L5), comp bands, review-cycle rhythm, policy canon, escalation rules, voice notes, hard nos. Every other skill in this agent reads it first.

  Additional context: {{request}}
---


# Draft the people-context doc that anchors every artifact
**Use when:** Values · leveling · comp · policies · escalation · voice.
**What it does:** I interview you briefly and write the shared doc: values, leveling (IC + manager L1-L5), comp bands, policy canon, escalation rules, voice, hard nos. Every other skill reads it first.
**Outcome:** Locked doc at context/people-context.md. Other skills stop asking baseline questions.
## Instructions
Run this as a user-facing action. Use the underlying `define-people-context` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft our people-context doc. Use the define-people-context skill. Interview me briefly, then write context/people-context.md: company values, team shape, leveling framework (IC + manager L1-L5), comp bands, review-cycle rhythm, policy canon, escalation rules, voice notes, hard nos. Every other skill in this agent reads it first.
```
