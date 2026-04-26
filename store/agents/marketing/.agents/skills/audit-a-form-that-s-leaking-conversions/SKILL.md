---
name: audit-a-form-that-s-leaking-conversions
description: "I review a form (demo / contact / lead), flag unnecessary fields, rewrite labels + helper text, and sequence fields by friction."
version: 1
tags: ["marketing", "overview-action", "audit"]
category: "Copy"
featured: yes
integrations: ["firecrawl", "semrush", "ahrefs", "perplexityai"]
image: "megaphone"
inputs:
  - name: form_type
    label: "Form Type"
  - name: form_slug
    label: "Form Slug"
    required: false
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Audit my {{form_type}} form. Use the audit skill with surface=form. Flag unnecessary fields, rewrite labels + helper text, and sequence fields by friction. Save to audits/form-{{form_slug}}-{{date}}.md. For signup flows specifically, use surface=signup-flow with the write-page-copy skill instead.
---


# Audit a form that's leaking conversions
**Use when:** Field cuts + label rewrites + friction sequencing.
**What it does:** I review a form (demo / contact / lead), flag unnecessary fields, rewrite labels + helper text, and sequence fields by friction.
**Outcome:** Audit at audits/form-{form}.md.
## Instructions
Run this as a user-facing action. Use the underlying `audit` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Audit my {form type} form. Use the audit skill with surface=form. Flag unnecessary fields, rewrite labels + helper text, and sequence fields by friction. Save to audits/form-{form-slug}-{YYYY-MM-DD}.md. For signup flows specifically, use surface=signup-flow with the write-page-copy skill instead.
```
