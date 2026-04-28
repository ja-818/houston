---
name: draft-an-nda-from-your-template-library
description: "Reads your NDA template from Google Drive (or uses market-standard boilerplate with a 'no template found' caveat stamp), substitutes variables, produces a draft with a top comment-block listing what needs founder confirmation."
version: 1
tags: ["legal", "overview-action", "draft-document"]
category: "Contracts"
featured: yes
integrations: ["googledocs", "googledrive", "notion", "firecrawl"]
image: "scroll"
---


# Draft an NDA from your template library
**Use when:** Reads your template, substitutes variables, stamps draft.
**What it does:** Reads your NDA template from Google Drive (or uses market-standard boilerplate with a 'no template found' caveat stamp), substitutes variables, produces a draft with a top comment-block listing what needs founder confirmation.
**Outcome:** Draft at drafts/nda/{counterparty}-{date}.md marked DRAFT  -  NOT FOR SIGNATURE.
## Instructions
Run this as a user-facing action. Use the underlying `draft-document` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft an NDA with {counterparty}. Use the draft-document skill with type=nda. Read my template library from domains.contracts.templateLibrary (or use market-standard boilerplate with a caveat stamp), substitute the variables (counterparty, effective date, term), and save to drafts/nda/{counterparty-slug}-{YYYY-MM-DD}.md.
```
