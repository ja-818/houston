---
name: monday-engineering-health-review
description: "I aggregate everything this agent produced this week across all 5 domains from outputs.json, flag gaps, recommend next moves, and list the decisions you need to make this week. A 2-minute scan."
version: 1
tags: ["engineering", "overview-action", "analyze"]
category: "Planning"
featured: yes
integrations: ["github", "gitlab", "firecrawl", "perplexityai"]
image: "laptop"
---


# Monday engineering health review
**Use when:** Shipped / In Progress / Blocked / Decisions Needed.
**What it does:** I aggregate everything this agent produced this week across all 5 domains from outputs.json, flag gaps, recommend next moves, and list the decisions you need to make this week. A 2-minute scan.
**Outcome:** Review at reviews/{YYYY-MM-DD}.md with recommended next moves per domain.
## Instructions
Run this as a user-facing action. Use the underlying `analyze` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Give me the Monday engineering review. Use the analyze skill with subject=engineering-health. Aggregate everything in outputs.json from the last 7 days, grouped by domain (planning / triage / development / reliability / docs). For each domain, name what shipped, what's stale, what's blocked. Close with a prioritized list of decisions I need to make this week, each with a paste-ready follow-up prompt. Save to reviews/{YYYY-MM-DD}.md.
```
