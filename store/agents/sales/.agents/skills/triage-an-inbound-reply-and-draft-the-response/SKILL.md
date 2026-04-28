---
name: triage-an-inbound-reply-and-draft-the-response
description: "I classify the inbound as interested / asking-question / objection / not-now / unsubscribe / spam and draft the right reply - booking slots for interested, a polite circle-back for not-now, the objection reframe for objection."
version: 1
tags: ["sales", "overview-action", "draft-outreach"]
category: "Inbound"
featured: yes
integrations: ["googlecalendar", "gmail", "outlook", "hubspot", "salesforce", "attio", "pipedrive", "gong", "fireflies", "stripe"]
image: "handshake"
---


# Triage an inbound reply and draft the response
**Use when:** Classify · interested / Q / objection / not-now / spam.
**What it does:** I classify the inbound as interested / asking-question / objection / not-now / unsubscribe / spam and draft the right reply  -  booking slots for interested, a polite circle-back for not-now, the objection reframe for objection.
**Outcome:** Reply draft at outreach/inbound-reply-{slug}-{date}.md.
## Instructions
Run this as a user-facing action. Use the underlying `draft-outreach` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Triage this inbound reply and draft the response. Use the draft-outreach skill with stage=inbound-reply. Classify as interested / asking-question / objection / not-now / unsubscribe / spam, then draft the right reply (for interested: booking with 2-3 calendar slots; for objection: chain into handle-objection; for not-now: polite circle-back). Save to outreach/inbound-reply-{lead-slug}-{YYYY-MM-DD}.md.
```
