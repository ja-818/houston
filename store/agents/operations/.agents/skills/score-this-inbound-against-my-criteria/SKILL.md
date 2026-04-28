---
name: score-this-inbound-against-my-criteria
description: "I apply the rubric from your operating context to produce a scored approve / decline / more-info recommendation with evidence per criterion."
version: 1
tags: ["operations", "overview-action", "run-approval-flow"]
category: "Vendors"
featured: yes
integrations: ["airtable", "firecrawl", "fireflies", "gmail", "gong", "googlecalendar", "googledocs", "googledrive", "googlesheets", "linear", "linkedin", "notion", "outlook", "perplexityai", "slack", "stripe"]
image: "clipboard"
---


# Score this inbound against my criteria
**Use when:** Approve / decline / more-info with evidence per criterion.
**What it does:** I apply the rubric from your operating context to produce a scored approve / decline / more-info recommendation with evidence per criterion.
**Outcome:** Scored decision at approvals/{kind}-{slug}.md.
## Instructions
Run this as a user-facing action. Use the underlying `run-approval-flow` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Score this inbound application. Use the run-approval-flow skill. Apply the rubric from my context/operations-context.md (priorities + key contacts + hard nos) to produce a scored approve / decline / more-info recommendation with evidence per criterion. Save to approvals/{kind}-{slug}.md.
```
