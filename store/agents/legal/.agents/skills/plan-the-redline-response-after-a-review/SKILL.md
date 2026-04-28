---
name: plan-the-redline-response-after-a-review
description: "Reads your prior contract-reviews/ entry + risk posture, produces must-have / nice-to-have / punt tiers with exact redline language for every must-have. You paste into the redline editor of your choice."
version: 1
tags: ["legal", "overview-action", "plan-redline"]
category: "Contracts"
featured: yes
integrations: ["airtable", "firecrawl", "gmail", "googledocs", "googledrive", "googlesheets", "notion", "outlook", "stripe"]
image: "scroll"
---


# Plan the redline response after a review
**Use when:** Must-have / nice-to-have / punt, with exact language.
**What it does:** Reads your prior contract-reviews/ entry + risk posture, produces must-have / nice-to-have / punt tiers with exact redline language for every must-have. You paste into the redline editor of your choice.
**Outcome:** Redline plan at redline-plans/{counterparty}-{date}.md.
## Instructions
Run this as a user-facing action. Use the underlying `plan-redline` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Plan the redline for the {counterparty} contract I just reviewed. Use the plan-redline skill. Read contract-reviews/{counterparty}-{YYYY-MM-DD}.md, combine with my risk posture from config/context-ledger.json, and produce must-have / nice-to-have / punt tiers with the exact redline language for every must-have. Save to redline-plans/{counterparty}-{YYYY-MM-DD}.md.
```
