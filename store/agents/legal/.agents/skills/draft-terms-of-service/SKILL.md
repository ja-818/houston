---
name: draft-terms-of-service
description: "Draft ToS with full sections (Usage / Account / IP / Acceptable-Use / Payment / Termination / Warranty / Liability / Disputes) - grounded in your actual product surface via Firecrawl."
version: 1
tags: ["legal", "overview-action", "draft-document"]
category: "Compliance"
featured: yes
integrations: ["googledocs", "googledrive", "notion", "firecrawl"]
image: "scroll"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Draft our Terms of Service. Use the draft-document skill with type=tos. Scrape my landing page via Firecrawl to infer product surface, structure as Usage / Account / IP / Acceptable-Use / Payment / Termination / Warranty / Liability / Disputes. Save to privacy-drafts/tos-{{date}}.md.
---


# Draft Terms of Service
**Use when:** Usage, IP, acceptable use, liability cap, disputes.
**What it does:** Draft ToS with full sections (Usage / Account / IP / Acceptable-Use / Payment / Termination / Warranty / Liability / Disputes)  -  grounded in your actual product surface via Firecrawl.
**Outcome:** ToS draft at privacy-drafts/tos-{date}.md.
## Instructions
Run this as a user-facing action. Use the underlying `draft-document` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft our Terms of Service. Use the draft-document skill with type=tos. Scrape my landing page via Firecrawl to infer product surface, structure as Usage / Account / IP / Acceptable-Use / Payment / Termination / Warranty / Liability / Disputes. Save to privacy-drafts/tos-{YYYY-MM-DD}.md.
```
