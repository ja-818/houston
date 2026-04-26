---
name: review-an-inbound-ip-assignment-clause
description: "Runs a full review of a contract with focus on IP terms (work-product assignment, background IP, feedback license, moral rights). Anything non-standard flags attorneyReviewRequired."
version: 1
tags: ["legal", "overview-action", "review-contract"]
category: "IP"
featured: yes
integrations: ["googledocs", "googledrive", "notion", "firecrawl"]
image: "scroll"
inputs:
  - name: counterparty_slug
    label: "Counterparty Slug"
    required: false
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Review the IP terms in this consulting / contractor agreement. Use the review-contract skill with mode=full. Focus on IP work-product assignment, background IP, feedback license, and moral-rights handling. Flag anything non-standard for attorney review. Save to contract-reviews/{{counterparty_slug}}-{{date}}.md.
---


# Review an inbound IP assignment clause
**Use when:** Traffic-light mode on IP-heavy MSAs and consulting.
**What it does:** Runs a full review of a contract with focus on IP terms (work-product assignment, background IP, feedback license, moral rights). Anything non-standard flags attorneyReviewRequired.
**Outcome:** IP-focused review at contract-reviews/{counterparty}-{date}.md.
## Instructions
Run this as a user-facing action. Use the underlying `review-contract` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Review the IP terms in this consulting / contractor agreement. Use the review-contract skill with mode=full. Focus on IP work-product assignment, background IP, feedback license, and moral-rights handling. Flag anything non-standard for attorney review. Save to contract-reviews/{counterparty-slug}-{YYYY-MM-DD}.md.
```
