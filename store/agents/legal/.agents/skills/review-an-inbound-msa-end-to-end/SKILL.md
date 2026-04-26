---
name: review-an-inbound-msa-end-to-end
description: "Full contract review: clause-by-clause extraction, green/yellow/red verdict against market standard for your stage, and an accept / redline / walk recommendation. Updates counterparty-tracker.json so downstream skills see it."
version: 1
tags: ["legal", "overview-action", "review-contract"]
category: "Contracts"
featured: yes
integrations: ["googledocs", "googledrive", "notion", "firecrawl"]
image: "scroll"
inputs:
  - name: counterparty
    label: "Counterparty"
  - name: counterparty_slug
    label: "Counterparty Slug"
    required: false
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Review the attached MSA from {{counterparty}}. Use the review-contract skill with mode=full. Extract the full clause map, grade each clause green/yellow/red against market standard for a solo-founder-stage company, and give me an accept / redline / walk recommendation. Save to contract-reviews/{{counterparty_slug}}-{{date}}.md and update counterparty-tracker.json.
---


# Review an inbound MSA end-to-end
**Use when:** Clause map + green/yellow/red verdict + walk/redline call.
**What it does:** Full contract review: clause-by-clause extraction, green/yellow/red verdict against market standard for your stage, and an accept / redline / walk recommendation. Updates counterparty-tracker.json so downstream skills see it.
**Outcome:** Review at contract-reviews/{counterparty}-{date}.md with the verdict in the opening paragraph.
## Instructions
Run this as a user-facing action. Use the underlying `review-contract` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Review the attached MSA from {counterparty}. Use the review-contract skill with mode=full. Extract the full clause map, grade each clause green/yellow/red against market standard for a solo-founder-stage company, and give me an accept / redline / walk recommendation. Save to contract-reviews/{counterparty-slug}-{YYYY-MM-DD}.md and update counterparty-tracker.json.
```
