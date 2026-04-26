---
name: the-monday-operations-review
description: "I aggregate everything this agent produced last week from outputs.json, flag gaps against your active priorities and upcoming renewals, and recommend the one move for the week."
version: 1
tags: ["operations", "overview-action", "run-review"]
category: "Planning"
featured: yes
integrations: ["googlesheets"]
image: "clipboard"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Give me the Monday operations review. Use the run-review skill with period=weekly. Aggregate everything I produced this past week from outputs.json across Planning / Scheduling / Finance / Vendors / Data. Flag what's stale (3+ weeks untouched), gaps against my active priorities, renewals in the next 30 days, and recommend the one most useful move for the week. Save to reviews/{{date}}.md.
---


# The Monday operations review
**Use when:** What shipped, what's stale, what's next. One move.
**What it does:** I aggregate everything this agent produced last week from outputs.json, flag gaps against your active priorities and upcoming renewals, and recommend the one move for the week.
**Outcome:** Review at reviews/{date}.md with the one move called out.
## Instructions
Run this as a user-facing action. Use the underlying `run-review` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Give me the Monday operations review. Use the run-review skill with period=weekly. Aggregate everything I produced this past week from outputs.json across Planning / Scheduling / Finance / Vendors / Data. Flag what's stale (3+ weeks untouched), gaps against my active priorities, renewals in the next 30 days, and recommend the one most useful move for the week. Save to reviews/{YYYY-MM-DD}.md.
```
