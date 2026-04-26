---
name: monday-legal-review-what-shipped-what-s-due
description: "Aggregates everything this agent produced in the last 7 days by domain, surfaces pending signatures, next 3 deadlines, and any open attorney-review backlog. A 2-minute scan Monday morning."
version: 1
tags: ["legal", "overview-action", "track-legal-state"]
category: "Advisory"
featured: yes
integrations: ["googledrive", "gmail", "notion"]
image: "scroll"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Give me the Monday legal review. Use the track-legal-state skill with scope=weekly-review. Aggregate this agent's outputs.json for the last 7 days (contract reviews, drafts, audits, filings) grouped by domain, surface pending signatures (from signature-status/), next 3 deadlines (from deadline-calendar.json), and any attorneyReviewRequired entries without a follow-up. Save to weekly-reviews/{{date}}.md.
---


# Monday legal review  -  what shipped, what's due
**Use when:** Rollup across every domain + attorney-review backlog.
**What it does:** Aggregates everything this agent produced in the last 7 days by domain, surfaces pending signatures, next 3 deadlines, and any open attorney-review backlog. A 2-minute scan Monday morning.
**Outcome:** Review at weekly-reviews/{date}.md with recommended next moves.
## Instructions
Run this as a user-facing action. Use the underlying `track-legal-state` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Give me the Monday legal review. Use the track-legal-state skill with scope=weekly-review. Aggregate this agent's outputs.json for the last 7 days (contract reviews, drafts, audits, filings) grouped by domain, surface pending signatures (from signature-status/), next 3 deadlines (from deadline-calendar.json), and any attorneyReviewRequired entries without a follow-up. Save to weekly-reviews/{YYYY-MM-DD}.md.
```
