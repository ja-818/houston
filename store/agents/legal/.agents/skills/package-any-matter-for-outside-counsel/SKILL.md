---
name: package-any-matter-for-outside-counsel
description: "Structured brief for outside counsel covering matter summary, numbered questions, deadline, quoted excerpts, entity snapshot, firm type, and desired outcome - everything the lawyer needs in one email."
version: 1
tags: ["legal", "overview-action", "draft-document"]
category: "Advisory"
featured: yes
integrations: ["googledocs", "googledrive", "notion", "firecrawl"]
image: "scroll"
inputs:
  - name: matter
    label: "Matter"
  - name: matter_slug
    label: "Matter Slug"
    required: false
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Package {{matter}} for outside counsel. Use the draft-document skill with type=escalation-brief. Structure: (1) Matter in 2-3 sentences, (2) Numbered questions for the lawyer, (3) Deadline + why, (4) Quoted excerpts with cite, (5) Entity snapshot, (6) Recommended firm type (corporate / commercial lit / privacy / IP / employment  -  no specific firms), (7) What we'd accept as an outcome. Save to escalations/{{matter_slug}}-{{date}}.md.
---


# Package any matter for outside counsel
**Use when:** Summary + questions + deadline + quoted cites.
**What it does:** Structured brief for outside counsel covering matter summary, numbered questions, deadline, quoted excerpts, entity snapshot, firm type, and desired outcome  -  everything the lawyer needs in one email.
**Outcome:** Brief at escalations/{matter}-{date}.md. Email counsel directly.
## Instructions
Run this as a user-facing action. Use the underlying `draft-document` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Package {matter} for outside counsel. Use the draft-document skill with type=escalation-brief. Structure: (1) Matter in 2-3 sentences, (2) Numbered questions for the lawyer, (3) Deadline + why, (4) Quoted excerpts with cite, (5) Entity snapshot, (6) Recommended firm type (corporate / commercial lit / privacy / IP / employment  -  no specific firms), (7) What we'd accept as an outcome. Save to escalations/{matter-slug}-{YYYY-MM-DD}.md.
```
