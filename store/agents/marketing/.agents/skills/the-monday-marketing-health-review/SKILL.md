---
name: the-monday-marketing-health-review
description: "I aggregate everything this agent produced this week across all 6 domains from outputs.json, flag gaps, recommend next moves. A 2-minute scan."
version: 1
tags: ["marketing", "overview-action", "analyze"]
category: "Positioning"
featured: yes
integrations: ["linkedin", "firecrawl", "semrush"]
image: "megaphone"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Give me the Monday marketing health review. Use the analyze skill with subject=marketing-health. Aggregate everything I produced this week across all domains (blog posts, campaigns, emails, social, page copy) from outputs.json, flag gaps (e.g. 'no email shipped in 3 weeks'), and recommend next moves grouped by domain. Save to analyses/marketing-health-{{date}}.md.
---


# The Monday marketing health review
**Use when:** What shipped, what's stale, what to do next.
**What it does:** I aggregate everything this agent produced this week across all 6 domains from outputs.json, flag gaps, recommend next moves. A 2-minute scan.
**Outcome:** Review at analyses/marketing-health-{YYYY-MM-DD}.md with recommended next moves per domain.
## Instructions
Run this as a user-facing action. Use the underlying `analyze` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Give me the Monday marketing health review. Use the analyze skill with subject=marketing-health. Aggregate everything I produced this week across all domains (blog posts, campaigns, emails, social, page copy) from outputs.json, flag gaps (e.g. 'no email shipped in 3 weeks'), and recommend next moves grouped by domain. Save to analyses/marketing-health-{YYYY-MM-DD}.md.
```
