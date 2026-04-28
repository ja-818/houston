---
name: prep-me-for-a-discovery-demo-call
description: "Pre-call one-pager: meeting goal from the playbook · attendees (enriched from LinkedIn) · question bank prioritized on the weakest qualification pillar · likely objections · exit criteria · landmines from call insights."
version: 1
tags: ["sales", "overview-action", "prep-meeting"]
category: "Meetings"
featured: yes
integrations: ["googlecalendar", "hubspot", "salesforce", "attio", "gong", "fireflies", "stripe", "linkedin"]
image: "handshake"
---


# Prep me for a discovery / demo call
**Use when:** Goal · attendees · questions · objections · exit criteria.
**What it does:** Pre-call one-pager: meeting goal from the playbook · attendees (enriched from LinkedIn) · question bank prioritized on the weakest qualification pillar · likely objections · exit criteria · landmines from call insights.
**Outcome:** Prep at deals/{slug}/call-prep-{date}.md  -  read it 5 minutes before.
## Instructions
Run this as a user-facing action. Use the underlying `prep-meeting` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Prep me for my call with {Acme}. Use the prep-meeting skill with type=call. Read the deal record from deals.json + any prior call analyses in calls/{slug}/, pull meeting details from my connected Google Calendar, and compile: meeting goal (from playbook), attendees, question bank (5-8 from the qualification framework, prioritized on the weakest pillar), likely objections with reframes, exit criteria for the stage advance, landmines from call-insights. Save to deals/{slug}/call-prep-{YYYY-MM-DD}.md.
```
