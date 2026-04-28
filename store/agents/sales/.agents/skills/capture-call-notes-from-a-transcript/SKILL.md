---
name: capture-call-notes-from-a-transcript
description: "I pull the transcript from your connected Gong / Fireflies (or accept a paste) and structure it: agenda vs actual · pains verbatim · decisions · actions · next step."
version: 1
tags: ["sales", "overview-action", "capture-call-notes"]
category: "Meetings"
featured: yes
integrations: ["gong", "fireflies"]
image: "handshake"
---


# Capture call notes from a transcript
**Use when:** Structure → pains, decisions, actions, next step.
**What it does:** I pull the transcript from your connected Gong / Fireflies (or accept a paste) and structure it: agenda vs actual · pains verbatim · decisions · actions · next step.
**Outcome:** Notes at calls/{slug}/notes-{date}.md. Chain into analyze subject=discovery-call.
## Instructions
Run this as a user-facing action. Use the underlying `capture-call-notes` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Capture notes from today's call with {Acme}. Use the capture-call-notes skill. Pull the transcript from my connected call-recorder (Gong / Fireflies via Composio) or I'll paste. Structure: agenda actual-vs-intended, attendees, pains stated (verbatim where possible), decisions, action items, next step. Save to calls/{slug}/notes-{YYYY-MM-DD}.md.
```
