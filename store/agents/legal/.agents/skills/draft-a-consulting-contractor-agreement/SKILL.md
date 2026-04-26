---
name: draft-a-consulting-contractor-agreement
description: "Draft contractor / consulting agreement anchored on CIIAA + deliverables + term + IP assignment, grounded in your template library (or market-standard boilerplate with a caveat stamp)."
version: 1
tags: ["legal", "overview-action", "draft-document"]
category: "Entity"
featured: yes
integrations: ["googledocs", "googledrive", "notion", "firecrawl"]
image: "scroll"
inputs:
  - name: contractor
    label: "Contractor"
  - name: contractor_slug
    label: "Contractor Slug"
    required: false
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Draft a consulting agreement with {{contractor}}. Use the draft-document skill with type=consulting. Anchor on CIIAA + deliverables + term, substitute variables, produce a draft. Save to drafts/consulting/{{contractor_slug}}-{{date}}.md.
---


# Draft a consulting / contractor agreement
**Use when:** CIIAA anchored + deliverables + term + IP assignment.
**What it does:** Draft contractor / consulting agreement anchored on CIIAA + deliverables + term + IP assignment, grounded in your template library (or market-standard boilerplate with a caveat stamp).
**Outcome:** Draft at drafts/consulting/{contractor}-{date}.md.
## Instructions
Run this as a user-facing action. Use the underlying `draft-document` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft a consulting agreement with {contractor}. Use the draft-document skill with type=consulting. Anchor on CIIAA + deliverables + term, substitute variables, produce a draft. Save to drafts/consulting/{contractor-slug}-{YYYY-MM-DD}.md.
```
