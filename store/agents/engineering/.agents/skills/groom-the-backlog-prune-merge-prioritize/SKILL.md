---
name: groom-the-backlog-prune-merge-prioritize
description: "I pull open tickets from Linear / Jira / GitHub Issues and return three review lists - keep, merge, close - each with one-line rationales. Never touches the tracker."
version: 1
tags: ["engineering", "overview-action", "groom-backlog"]
category: "Triage"
featured: yes
integrations: ["notion", "github", "linear", "jira"]
image: "laptop"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Groom the backlog. Use the groom-backlog skill. Pull all open tickets from the connected Linear / Jira / GitHub Issues. Return three review lists: keep-and-prioritize, merge-as-duplicates, close-as-stale  -  each with a one-line rationale per ticket. Save to backlog-grooming/{{date}}.md. I never close, merge, or reprioritize in the tracker  -  you review and act.
---


# Groom the backlog  -  prune, merge, prioritize
**Use when:** Three lists: keep / merge / close. I never close.
**What it does:** I pull open tickets from Linear / Jira / GitHub Issues and return three review lists  -  keep, merge, close  -  each with one-line rationales. Never touches the tracker.
**Outcome:** Lists at backlog-grooming/{YYYY-MM-DD}.md. Review and act in your tracker.
## Instructions
Run this as a user-facing action. Use the underlying `groom-backlog` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Groom the backlog. Use the groom-backlog skill. Pull all open tickets from the connected Linear / Jira / GitHub Issues. Return three review lists: keep-and-prioritize, merge-as-duplicates, close-as-stale  -  each with a one-line rationale per ticket. Save to backlog-grooming/{YYYY-MM-DD}.md. I never close, merge, or reprioritize in the tracker  -  you review and act.
```
