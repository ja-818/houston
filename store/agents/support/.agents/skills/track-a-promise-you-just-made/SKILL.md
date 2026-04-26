---
name: track-a-promise-you-just-made
description: "I extract the verbatim promise from your draft, parse the due date, link to the conversation, and append to `followups.json`. Surfaces in every morning brief until you mark it done."
version: 1
tags: ["support", "overview-action", "promise-tracker"]
category: "Inbox"
featured: yes
integrations: ["attio", "customerio", "github", "gmail", "googledocs", "hubspot", "jira", "linear", "loops", "mailchimp", "microsoftteams", "notion", "outlook", "salesforce", "slack", "stripe"]
image: "headphone"
inputs:
  - name: request
    label: "Additional context"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Track a commitment I just made. Use the promise-tracker skill. Extract the verbatim promise from the draft or chat, parse the due date (explicit / relative / vague defaults to +48h), link to the conversation and customer, and append to followups.json with status=open.

  Additional context: {{request}}
---


# Track a promise you just made
**Use when:** Due date parsed, logged, surfaced every morning.
**What it does:** I extract the verbatim promise from your draft, parse the due date, link to the conversation, and append to `followups.json`. Surfaces in every morning brief until you mark it done.
**Outcome:** Entry in `followups.json`  -  so you never forget a 'by Friday.'
## Instructions
Run this as a user-facing action. Use the underlying `promise-tracker` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Track a commitment I just made. Use the promise-tracker skill. Extract the verbatim promise from the draft or chat, parse the due date (explicit / relative / vague defaults to +48h), link to the conversation and customer, and append to followups.json with status=open.
```
