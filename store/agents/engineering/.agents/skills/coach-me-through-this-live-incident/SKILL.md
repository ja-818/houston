---
name: coach-me-through-this-live-incident
description: "LIVE COACH + SCRIBE. I walk you through stabilize → communicate → mitigate → verify → document, capturing the timeline to incidents/{id}.md. Never auto-rollbacks, never runs prod commands."
version: 1
tags: ["engineering", "overview-action", "run-incident-response"]
category: "Reliability"
featured: yes
integrations: ["slack"]
image: "laptop"
---


# Coach me through this live incident
**Use when:** Stabilize → communicate → mitigate → verify → document.
**What it does:** LIVE COACH + SCRIBE. I walk you through stabilize → communicate → mitigate → verify → document, capturing the timeline to incidents/{id}.md. Never auto-rollbacks, never runs prod commands.
**Outcome:** A live incident doc at incidents/{id}.md that becomes the postmortem seed.
## Instructions
Run this as a user-facing action. Use the underlying `run-incident-response` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
An incident just fired  -  run me through it. Use the run-incident-response skill. LIVE COACH + SCRIBE mode. Walk me through stabilize → communicate → mitigate → verify → document. Capture the incident timeline to incidents/{id}.md as we go. Never auto-rollback, never run prod commands  -  produce the next action, I execute it.
```
