---
name: monday-engineering-review-reliability-focused
description: "I aggregate incidents, postmortems, runbooks, deploy-readiness verdicts, and observability audits from outputs.json and flag what needs follow-up this week."
version: 1
tags: ["engineering", "overview-action", "analyze"]
category: "Reliability"
featured: yes
integrations: ["github", "gitlab", "firecrawl", "perplexityai"]
image: "laptop"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Give me the weekly engineering review, focused on reliability. Use the analyze skill with subject=engineering-health. Aggregate incidents, postmortems, runbooks, deploy-readiness verdicts, and observability audits from the last 7 days. Call out any incident without a postmortem, any runbook that's stale vs the current architecture, any deploy-readiness SOFT-GO that needs follow-up. Save to reviews/{{date}}.md.
---


# Monday engineering review (reliability-focused)
**Use when:** Shipped incidents, open postmortems, stale runbooks.
**What it does:** I aggregate incidents, postmortems, runbooks, deploy-readiness verdicts, and observability audits from outputs.json and flag what needs follow-up this week.
**Outcome:** Review at reviews/{YYYY-MM-DD}.md with the reliability gaps called out.
## Instructions
Run this as a user-facing action. Use the underlying `analyze` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Give me the weekly engineering review, focused on reliability. Use the analyze skill with subject=engineering-health. Aggregate incidents, postmortems, runbooks, deploy-readiness verdicts, and observability audits from the last 7 days. Call out any incident without a postmortem, any runbook that's stale vs the current architecture, any deploy-readiness SOFT-GO that needs follow-up. Save to reviews/{YYYY-MM-DD}.md.
```
