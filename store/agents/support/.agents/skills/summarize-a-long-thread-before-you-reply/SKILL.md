---
name: summarize-a-long-thread-before-you-reply
description: "I produce exactly 3 bullets - where we are, what we promised (pulled from `followups.json`), what the customer expects next - so you're not re-reading 20 messages cold."
version: 1
tags: ["support", "overview-action", "thread-summary"]
category: "Inbox"
featured: yes
integrations: ["gmail", "outlook"]
image: "headphone"
inputs:
  - name: id
    label: "ID"
    required: false
prompt_template: |
  Summarize the thread at conversations/{{id}}/thread.json. Use the thread-summary skill. Produce exactly 3 bullets: where we are (last message + current state), what we promised (pulled from followups.json), what the customer expects next. Append the summary to conversations/{{id}}/notes.md.
---


# Summarize a long thread before you reply
**Use when:** 3 bullets: where we are, promised, expects next.
**What it does:** I produce exactly 3 bullets  -  where we are, what we promised (pulled from `followups.json`), what the customer expects next  -  so you're not re-reading 20 messages cold.
**Outcome:** Summary appended to `conversations/{id}/notes.md`.
## Instructions
Run this as a user-facing action. Use the underlying `thread-summary` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Summarize the thread at conversations/{id}/thread.json. Use the thread-summary skill. Produce exactly 3 bullets: where we are (last message + current state), what we promised (pulled from followups.json), what the customer expects next. Append the summary to conversations/{id}/notes.md.
```
