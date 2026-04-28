---
name: draft-a-one-page-proposal
description: "One-page proposal grounded in their verbatim problem statement and success metric from call notes. Pricing inside your playbook's stance - any exception gets flagged for your approval."
version: 1
tags: ["sales", "overview-action", "draft-proposal"]
category: "Meetings"
featured: yes
integrations: ["attio", "firecrawl", "fireflies", "gmail", "gong", "googlecalendar", "googledocs", "hubspot", "linear", "linkedin", "notion", "outlook", "perplexityai", "pipedrive", "reddit", "salesforce", "stripe", "twitter"]
image: "handshake"
---


# Draft a one-page proposal
**Use when:** Problem · scope · pricing · terms · success metrics.
**What it does:** One-page proposal grounded in their verbatim problem statement and success metric from call notes. Pricing inside your playbook's stance  -  any exception gets flagged for your approval.
**Outcome:** Proposal at deals/{slug}/proposal-v{N}.md with any pricing flags surfaced.
## Instructions
Run this as a user-facing action. Use the underlying `draft-proposal` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft a proposal for {Acme}. Use the draft-proposal skill. Read the deal history (all call notes + analyses under calls/{slug}/), extract their problem statement verbatim, their success metric verbatim, and stakeholders. Draft the one-pager: problem → approach → scope (in + out) → pricing (within playbook's stance) → terms → success metrics → timeline → next step. Save to deals/{slug}/proposal-v{N}.md. Flag anything outside the pricing stance with FLAG: needs approval.
```
