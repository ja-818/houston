---
name: the-monday-people-review
description: "Aggregates every artifact this agent produced this week across all 5 domains, flags stale drafts and cross-cutting gaps, recommends next moves per domain. A 2-minute scan."
version: 1
tags: ["people", "overview-action", "analyze"]
category: "Performance"
featured: yes
integrations: ["hubspot", "github", "linear", "jira", "slack", "discord", "firecrawl"]
image: "busts-in-silhouette"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Give me the Monday people review. Use the analyze skill with subject=people-health. Aggregate everything I produced this week across hiring, onboarding, performance, compliance, and culture from outputs.json. Per domain: what shipped, what's stale (>7 days as draft), gaps. Cross-cutting: open-req drift, retention reds without stay-conversation follow-up, compliance near-deadlines, review-cycle drift. Write to analyses/people-health-{{date}}.md.
---


# The Monday people review
**Use when:** What shipped · what's stale · what to do next.
**What it does:** Aggregates every artifact this agent produced this week across all 5 domains, flags stale drafts and cross-cutting gaps, recommends next moves per domain. A 2-minute scan.
**Outcome:** Review at analyses/people-health-{date}.md with recommended next moves + what to flip to ready.
## Instructions
Run this as a user-facing action. Use the underlying `analyze` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Give me the Monday people review. Use the analyze skill with subject=people-health. Aggregate everything I produced this week across hiring, onboarding, performance, compliance, and culture from outputs.json. Per domain: what shipped, what's stale (>7 days as draft), gaps. Cross-cutting: open-req drift, retention reds without stay-conversation follow-up, compliance near-deadlines, review-cycle drift. Write to analyses/people-health-{YYYY-MM-DD}.md.
```
