---
name: fix-your-signup-flow-end-to-end
description: "End-to-end signup audit: pre-signup page, email field, password requirements, verification, first-screen post-signup. Copy + field-level recs."
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
  Audit my signup flow end-to-end. Use the write-page-copy skill with surface=signup-flow. Cover pre-signup page, email field, password requirements, verification, first-screen post-signup. Copy + field-level recommendations. Save to page-copy/signup-flow-{{slug}}.md.
---


# Fix your signup flow end-to-end
**Use when:** Pre-signup → email → password → first screen.
**What it does:** End-to-end signup audit: pre-signup page, email field, password requirements, verification, first-screen post-signup. Copy + field-level recs.
**Outcome:** Review at page-copy/signup-flow-{slug}.md.
## Instructions
Run this as a user-facing action. Use the underlying `write-page-copy` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Audit my signup flow end-to-end. Use the write-page-copy skill with surface=signup-flow. Cover pre-signup page, email field, password requirements, verification, first-screen post-signup. Copy + field-level recommendations. Save to page-copy/signup-flow-{slug}.md.
```
