---
name: triage-this-inbound-feature-request
description: "I classify feature requests / sales-call notes / shower thoughts as roadmap-change / ticket / design-doc / skip with reasoning, and write the exact paste-ready prompt for the skill that owns it next."
version: 1
tags: ["engineering", "overview-action", "triage-inbound-request"]
category: "Triage"
featured: yes
integrations: ["slack"]
image: "laptop"
inputs:
  - name: slug
    label: "Slug"
    required: false
prompt_template: |
  Triage this inbound feature request. Use the triage-inbound-request skill. I'll paste the raw request (user email, sales call note, shower thought). Classify it: roadmap-change (route to plan-roadmap), ticket (route to triage-bug-report or a backlog entry), design-doc (route to draft-design-doc), or skip (with reasoning). Include the exact copy-paste prompt for the skill that owns it next. Save to inbound-triage/{{slug}}.md.
---


# Triage this inbound feature request
**Use when:** Roadmap change, ticket, design doc, or skip.
**What it does:** I classify feature requests / sales-call notes / shower thoughts as roadmap-change / ticket / design-doc / skip with reasoning, and write the exact paste-ready prompt for the skill that owns it next.
**Outcome:** A verdict at inbound-triage/{slug}.md with a paste-ready follow-up prompt.
## Instructions
Run this as a user-facing action. Use the underlying `triage-inbound-request` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Triage this inbound feature request. Use the triage-inbound-request skill. I'll paste the raw request (user email, sales call note, shower thought). Classify it: roadmap-change (route to plan-roadmap), ticket (route to triage-bug-report or a backlog entry), design-doc (route to draft-design-doc), or skip (with reasoning). Include the exact copy-paste prompt for the skill that owns it next. Save to inbound-triage/{slug}.md.
```
