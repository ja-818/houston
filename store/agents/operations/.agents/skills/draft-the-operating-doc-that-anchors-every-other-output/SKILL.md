---
name: draft-the-operating-doc-that-anchors-every-other-output
description: "I interview you briefly and write the full operating doc (company, priorities, rhythm, key contacts, tools, vendor posture, hard nos, voice) to context/operations-context.md. Every other skill reads it first."
version: 1
tags: ["operations", "overview-action", "define-operating-context"]
category: "Planning"
featured: yes
integrations: ["airtable", "firecrawl", "fireflies", "gmail", "gong", "googlecalendar", "googledocs", "googledrive", "googlesheets", "linear", "linkedin", "notion", "outlook", "perplexityai", "slack", "stripe"]
image: "clipboard"
inputs:
  - name: request
    label: "Additional context"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Help me set up my operating context. Use the define-operating-context skill. Interview me briefly on company + priorities + rhythm + key contacts + tools + vendor posture + hard nos + voice, then write the full doc to context/operations-context.md  -  the source of truth every other skill reads before producing anything substantive.

  Additional context: {{request}}
---


# Draft the operating doc that anchors every other output
**Use when:** Company, priorities, rhythm, VIPs, vendor posture, hard nos.
**What it does:** I interview you briefly and write the full operating doc (company, priorities, rhythm, key contacts, tools, vendor posture, hard nos, voice) to context/operations-context.md. Every other skill reads it first.
**Outcome:** A locked operating doc at context/operations-context.md. Every skill reads it before producing anything substantive.
## Instructions
Run this as a user-facing action. Use the underlying `define-operating-context` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Help me set up my operating context. Use the define-operating-context skill. Interview me briefly on company + priorities + rhythm + key contacts + tools + vendor posture + hard nos + voice, then write the full doc to context/operations-context.md  -  the source of truth every other skill reads before producing anything substantive.
```
