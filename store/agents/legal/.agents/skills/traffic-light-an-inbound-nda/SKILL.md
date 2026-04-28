---
name: traffic-light-an-inbound-nda
description: "Fast 7-dimension rubric for inbound NDAs (term, mutuality, confidential-info definition, carve-outs, jurisdiction, non-solicit smuggling, return/destruction) with a specific redline on every Red item - not a generic 'we'll send our form'."
version: 1
tags: ["legal", "overview-action", "review-contract"]
category: "Contracts"
featured: yes
integrations: ["googledocs", "googledrive", "notion", "firecrawl"]
image: "scroll"
---


# Traffic-light an inbound NDA
**Use when:** 7-dimension rubric, redlines on every Red item.
**What it does:** Fast 7-dimension rubric for inbound NDAs (term, mutuality, confidential-info definition, carve-outs, jurisdiction, non-solicit smuggling, return/destruction) with a specific redline on every Red item  -  not a generic 'we'll send our form'.
**Outcome:** NDA review at ndas/{counterparty}-{date}.md  -  copy the redlines into your reply.
## Instructions
Run this as a user-facing action. Use the underlying `review-contract` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Traffic-light this NDA from {counterparty}. Use the review-contract skill with mode=nda-traffic-light. Grade term, mutuality, confidential-info definition, carve-outs, jurisdiction, non-solicit smuggling, and return/destruction. Write a specific redline for every Red item. Save to ndas/{counterparty-slug}-{YYYY-MM-DD}.md.
```
