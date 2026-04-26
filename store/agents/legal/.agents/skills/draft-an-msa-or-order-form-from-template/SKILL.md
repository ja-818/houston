---
name: draft-an-msa-or-order-form-from-template
description: "Draft commercial customer paper (MSA, order form, consulting agreement) anchored on your template. Comment block flags variables needing your confirmation."
version: 1
tags: ["legal", "overview-action", "draft-document"]
category: "Contracts"
featured: yes
integrations: ["googledocs", "googledrive", "notion", "firecrawl"]
image: "scroll"
inputs:
  - name: counterparty
    label: "Counterparty"
  - name: type
    label: "Type"
  - name: counterparty_slug
    label: "Counterparty Slug"
    required: false
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Draft an MSA for {{counterparty}}. Use the draft-document skill with type=msa (or type=order-form for a deal tied to an existing MSA, or type=consulting for a contractor engagement). Anchor on my template library, substitute commercials (fee, term, payment terms), produce a draft. Save to drafts/{{type}}/{{counterparty_slug}}-{{date}}.md.
---


# Draft an MSA or Order Form from template
**Use when:** Customer-facing paper  -  MSA, order form, consulting.
**What it does:** Draft commercial customer paper (MSA, order form, consulting agreement) anchored on your template. Comment block flags variables needing your confirmation.
**Outcome:** Draft at drafts/{type}/{counterparty}-{date}.md.
## Instructions
Run this as a user-facing action. Use the underlying `draft-document` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft an MSA for {counterparty}. Use the draft-document skill with type=msa (or type=order-form for a deal tied to an existing MSA, or type=consulting for a contractor engagement). Anchor on my template library, substitute commercials (fee, term, payment terms), produce a draft. Save to drafts/{type}/{counterparty-slug}-{YYYY-MM-DD}.md.
```
