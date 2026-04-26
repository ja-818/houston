---
name: draft-a-reply-in-your-voice
description: "I pull the customer dossier, read your voice samples, mirror your tone, and address the specific ask (bug / how-to / billing). I never promise a date you haven't approved."
version: 1
tags: ["support", "overview-action", "draft-reply"]
category: "Inbox"
featured: yes
integrations: ["gmail", "outlook"]
image: "headphone"
inputs:
  - name: id
    label: "ID"
    required: false
prompt_template: |
  Draft a reply for conversation {{id}}. Use the draft-reply skill. Pull the customer dossier via customer-view, read config/voice.md, mirror my tone, address the specific ask (bug / how-to / billing). Never promise a date I haven't approved. Save to conversations/{{id}}/draft.md.
---


# Draft a reply in your voice
**Use when:** Dossier-aware, voice-matched, never sent.
**What it does:** I pull the customer dossier, read your voice samples, mirror your tone, and address the specific ask (bug / how-to / billing). I never promise a date you haven't approved.
**Outcome:** Draft at `conversations/{id}/draft.md`  -  approve in chat.
## Instructions
Run this as a user-facing action. Use the underlying `draft-reply` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft a reply for conversation {id}. Use the draft-reply skill. Pull the customer dossier via customer-view, read config/voice.md, mirror my tone, address the specific ask (bug / how-to / billing). Never promise a date I haven't approved. Save to conversations/{id}/draft.md.
```
