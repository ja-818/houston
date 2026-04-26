---
name: draft-replies-to-the-inbound-emails
description: "I pull your needs-me threads, draft replies in your voice from config/voice.md, and save each as a draft in Gmail / Outlook. You approve and send."
version: 1
tags: ["operations", "overview-action", "draft-message"]
category: "Scheduling"
featured: yes
integrations: ["gmail", "outlook"]
image: "clipboard"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
  - name: slug
    label: "Slug"
    required: false
prompt_template: |
  Draft replies to my needs-me inbox threads. Use the draft-message skill with type=reply. Pull threads from Gmail / Outlook, draft in my voice (from config/voice.md), save each as a draft in the inbox provider, and write the human-readable record to drafts/reply-{{date}}-{{slug}}.md. Never sends.
---


# Draft replies to the inbound emails
**Use when:** Your voice, saved as inbox drafts  -  you send.
**What it does:** I pull your needs-me threads, draft replies in your voice from config/voice.md, and save each as a draft in Gmail / Outlook. You approve and send.
**Outcome:** Drafts at drafts/reply-{date}-{slug}.md + drafts in your inbox.
## Instructions
Run this as a user-facing action. Use the underlying `draft-message` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft replies to my needs-me inbox threads. Use the draft-message skill with type=reply. Pull threads from Gmail / Outlook, draft in my voice (from config/voice.md), save each as a draft in the inbox provider, and write the human-readable record to drafts/reply-{YYYY-MM-DD}-{slug}.md. Never sends.
```
