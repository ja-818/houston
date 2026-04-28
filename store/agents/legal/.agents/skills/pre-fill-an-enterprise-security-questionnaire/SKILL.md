---
name: pre-fill-an-enterprise-security-questionnaire
description: "Extracts the question set (SIG-lite / CAIQ / custom), pre-fills every question answerable from your answers library, groups unanswered ones by topic so one founder sit-down resolves many. Appends new answers back to the library."
version: 1
tags: ["legal", "overview-action", "security-questionnaire"]
category: "Compliance"
featured: yes
integrations: ["googlesheets", "googledocs", "googledrive", "airtable"]
image: "scroll"
---


# Pre-fill an enterprise security questionnaire
**Use when:** SIG / CAIQ / custom  -  pulls from your answers lib.
**What it does:** Extracts the question set (SIG-lite / CAIQ / custom), pre-fills every question answerable from your answers library, groups unanswered ones by topic so one founder sit-down resolves many. Appends new answers back to the library.
**Outcome:** Draft at security-questionnaires/{prospect}-{date}.md with unanswered grouped.
## Instructions
Run this as a user-facing action. Use the underlying `security-questionnaire` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Help me fill out this security questionnaire from {prospect} (SIG-lite / CAIQ / custom sheet). Use the security-questionnaire skill. Extract the question set, pre-fill every question answerable from config/security-answers.md, group the rest by topic so one sit-down with me resolves many. Save the draft to security-questionnaires/{prospect-slug}-{YYYY-MM-DD}.md.
```
