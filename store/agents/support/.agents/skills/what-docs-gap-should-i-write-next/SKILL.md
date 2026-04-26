---
name: what-docs-gap-should-i-write-next
description: "Ranks patterns by volume × plan-tier weight × freshness, surfaces the top 3 with source tickets, and offers to chain straight into `write-article type=from-ticket` for any you pick."
version: 1
tags: ["support", "overview-action", "gap-surface"]
category: "Help Center"
featured: yes
integrations: ["attio", "customerio", "github", "gmail", "googledocs", "hubspot", "jira", "linear", "loops", "mailchimp", "microsoftteams", "notion", "outlook", "salesforce", "slack", "stripe"]
image: "headphone"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Surface the top 3 docs gaps. Use the gap-surface skill. Read patterns.json, filter to clusters without a matching article, rank by occurrenceCount × customer-value weight × freshness, and present the top 3 with source ticket ids. Ask which I want drafted, then chain write-article type=from-ticket. Save to gaps/{{date}}.md.
---


# What docs gap should I write next?
**Use when:** Ranked by volume × customer value × freshness.
**What it does:** Ranks patterns by volume × plan-tier weight × freshness, surfaces the top 3 with source tickets, and offers to chain straight into `write-article type=from-ticket` for any you pick.
**Outcome:** Ranked list at `gaps/{date}.md`  -  write the #1 before lunch.
## Instructions
Run this as a user-facing action. Use the underlying `gap-surface` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Surface the top 3 docs gaps. Use the gap-surface skill. Read patterns.json, filter to clusters without a matching article, rank by occurrenceCount × customer-value weight × freshness, and present the top 3 with source ticket ids. Ask which I want drafted, then chain write-article type=from-ticket. Save to gaps/{YYYY-MM-DD}.md.
```
