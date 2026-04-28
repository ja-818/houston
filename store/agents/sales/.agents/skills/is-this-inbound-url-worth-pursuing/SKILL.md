---
name: is-this-inbound-url-worth-pursuing
description: "Fast 30-second read of an inbound URL: IN-ICP / BORDER / OUT against your playbook's disqualifiers, with one angle if IN."
version: 1
tags: ["sales", "overview-action", "research-account"]
category: "Inbound"
featured: yes
integrations: ["gmail", "hubspot", "salesforce", "attio", "linkedin", "firecrawl", "perplexityai"]
image: "handshake"
---


# Is this inbound URL worth pursuing?
**Use when:** 30-second qualify + angle, or drop.
**What it does:** Fast 30-second read of an inbound URL: IN-ICP / BORDER / OUT against your playbook's disqualifiers, with one angle if IN.
**Outcome:** Qualify note at leads/{slug}/qualify-{date}.md + next-step recommendation.
## Instructions
Run this as a user-facing action. Use the underlying `research-account` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Is {url} worth pursuing? Use the research-account skill with depth=quick-qualify. One scrape via Firecrawl, one decision (IN-ICP / BORDER / OUT) vs the playbook's disqualifiers, one angle if IN. Save to leads/{slug}/qualify-{YYYY-MM-DD}.md. If OUT, I'll recommend dropping; if IN, I'll suggest draft-outreach next.
```
