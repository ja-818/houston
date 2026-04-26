---
name: rewrite-in-app-onboarding-copy
description: "Empty states, tooltips, nudges, welcome modals inside the product. Every string ties to an activation event you care about."
version: 1
tags: ["marketing", "overview-action", "write-page-copy"]
category: "Copy"
featured: yes
integrations: ["reddit", "firecrawl"]
image: "megaphone"
inputs:
  - name: slug
    label: "Slug"
    required: false
prompt_template: |
  Rewrite my in-app onboarding copy. Use the write-page-copy skill with surface=onboarding. Empty states, tooltips, nudges, welcome modals. Every string ties to an activation event I care about. Save to page-copy/onboarding-{{slug}}.md.
---


# Rewrite in-app onboarding copy
**Use when:** Empty states, tooltips, nudges  -  tied to activation.
**What it does:** Empty states, tooltips, nudges, welcome modals inside the product. Every string ties to an activation event you care about.
**Outcome:** Copy set at page-copy/onboarding-{slug}.md.
## Instructions
Run this as a user-facing action. Use the underlying `write-page-copy` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Rewrite my in-app onboarding copy. Use the write-page-copy skill with surface=onboarding. Empty states, tooltips, nudges, welcome modals. Every string ties to an activation event I care about. Save to page-copy/onboarding-{slug}.md.
```
