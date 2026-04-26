---
name: log-a-bug-candidate-from-a-ticket
description: "I extract repro steps, affected version, error / stack trace, apply severity, and append to `bug-candidates.json`. Offers to chain to your tracker (GitHub / Linear / Jira) - never files without your approval."
version: 1
tags: ["support", "overview-action", "detect-signal"]
category: "Inbox"
featured: yes
integrations: ["gmail", "github", "linear", "jira"]
image: "headphone"
inputs:
  - name: request
    label: "Additional context"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Extract a bug report from this thread. Use the detect-signal skill with signal=bug. Pull repro steps, affected version, error message / stack trace, apply severity from the context doc, and append to bug-candidates.json. Offer to chain to my connected tracker (GitHub / Linear / Jira via Composio).

  Additional context: {{request}}
---


# Log a bug candidate from a ticket
**Use when:** Repro + severity  -  never filed without approval.
**What it does:** I extract repro steps, affected version, error / stack trace, apply severity, and append to `bug-candidates.json`. Offers to chain to your tracker (GitHub / Linear / Jira)  -  never files without your approval.
**Outcome:** Entry in `bug-candidates.json`  -  one click away from a real issue.
## Instructions
Run this as a user-facing action. Use the underlying `detect-signal` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Extract a bug report from this thread. Use the detect-signal skill with signal=bug. Pull repro steps, affected version, error message / stack trace, apply severity from the context doc, and append to bug-candidates.json. Offer to chain to my connected tracker (GitHub / Linear / Jira via Composio).
```
