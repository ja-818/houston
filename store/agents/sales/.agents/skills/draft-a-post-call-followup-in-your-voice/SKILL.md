---
name: draft-a-post-call-followup-in-your-voice
description: "Post-call recap in your voice, grounded in the call analysis: subject cites their pain verbatim, body answers the stated objection, close names a specific dated next step."
version: 1
tags: ["sales", "overview-action", "draft-outreach"]
category: "Meetings"
featured: yes
integrations: ["googlecalendar", "gmail", "outlook", "hubspot", "salesforce", "attio", "pipedrive", "gong", "fireflies", "stripe"]
image: "handshake"
---


# Draft a post-call followup in your voice
**Use when:** Recap · objection addressed · specific next step.
**What it does:** Post-call recap in your voice, grounded in the call analysis: subject cites their pain verbatim, body answers the stated objection, close names a specific dated next step.
**Outcome:** Followup at deals/{slug}/followup-{date}.md.
## Instructions
Run this as a user-facing action. Use the underlying `draft-outreach` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft my followup for today's call with {Acme}. Use the draft-outreach skill with stage=followup. Read the latest calls/{slug}/notes-*.md and analysis-*.md. Subject: 'Re: {their pain, in their words}'. Body: confirm we heard them → 2-3 bullets answering the stated objection / open question → next step with a specific date. Match voice from config/voice.md. Save to deals/{slug}/followup-{YYYY-MM-DD}.md.
```
