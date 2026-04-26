---
name: update-your-routing-rules-when-reality-changes
description: "I read current rules, ask what's changing, rewrite the routing section of `context/support-context.md`. Every `triage-incoming` and `detect-signal` run after picks up the new rules - no manual re-sync."
version: 1
tags: ["support", "overview-action", "tune-routing-rules"]
category: "Quality"
featured: yes
integrations: ["googledocs", "stripe", "notion", "github", "linear"]
image: "headphone"
inputs:
  - name: request
    label: "Additional context"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Update our routing rules. Use the tune-routing-rules skill. Read context/support-context.md, restate current rules in 3-4 lines, capture what's changing (new tracker / classification / escalation contact / refund approver), and rewrite the routing section cleanly. Every triage-incoming and detect-signal run after this picks up the new rules automatically.

  Additional context: {{request}}
---


# Update your routing rules when reality changes
**Use when:** Moved tracker? New tier? Fix the rules once.
**What it does:** I read current rules, ask what's changing, rewrite the routing section of `context/support-context.md`. Every `triage-incoming` and `detect-signal` run after picks up the new rules  -  no manual re-sync.
**Outcome:** Updated `context/support-context.md`  -  propagates instantly.
## Instructions
Run this as a user-facing action. Use the underlying `tune-routing-rules` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Update our routing rules. Use the tune-routing-rules skill. Read context/support-context.md, restate current rules in 3-4 lines, capture what's changing (new tracker / classification / escalation contact / refund approver), and rewrite the routing section cleanly. Every triage-incoming and detect-signal run after this picks up the new rules automatically.
```
