---
name: full-account-research-brief-with-sources
description: "Multi-pass cited brief on an account: site scrape + 12 weeks of news + tech-stack signals + LinkedIn scan via Exa and Firecrawl. 3 outreach angles ranked by strength."
version: 1
tags: ["sales", "overview-action", "research-account"]
category: "Outbound"
featured: yes
integrations: ["gmail", "hubspot", "salesforce", "attio", "linkedin", "firecrawl", "perplexityai"]
image: "handshake"
---


# Full account research brief with sources
**Use when:** Site scrape + recent news + tech stack + outreach angles.
**What it does:** Multi-pass cited brief on an account: site scrape + 12 weeks of news + tech-stack signals + LinkedIn scan via Exa and Firecrawl. 3 outreach angles ranked by strength.
**Outcome:** Brief at accounts/{slug}/brief-{date}.md. Chain into draft-outreach or prep-meeting.
## Instructions
Run this as a user-facing action. Use the underlying `research-account` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Research {Acme}  -  give me a full brief. Use the research-account skill with depth=full-brief. Scrape their site via Firecrawl, pull the last 12 weeks of news via Exa, detect tech-stack signals, scan company LinkedIn. Structure: snapshot, recent signals (cited), tech stack, buying-committee guesses, 3 outreach angles ranked. Save to accounts/{slug}/brief-{YYYY-MM-DD}.md.
```
