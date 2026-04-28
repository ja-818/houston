---
name: draft-a-60-90s-cold-call-script
description: "60-90s script: opener · pattern-interrupt (specific observation) · 2 discovery questions matched to the weakest qualification pillar for their segment · soft CTA · landmine to avoid."
version: 1
tags: ["sales", "overview-action", "draft-outreach"]
category: "Outbound"
featured: yes
integrations: ["googlecalendar", "gmail", "outlook", "hubspot", "salesforce", "attio", "pipedrive", "gong", "fireflies", "stripe"]
image: "handshake"
---


# Draft a 60-90s cold-call script
**Use when:** Opener + pattern-interrupt + 2 discovery Qs + CTA.
**What it does:** 60-90s script: opener · pattern-interrupt (specific observation) · 2 discovery questions matched to the weakest qualification pillar for their segment · soft CTA · landmine to avoid.
**Outcome:** Script at outreach/script-{slug}-{date}.md  -  read it before the call.
## Instructions
Run this as a user-facing action. Use the underlying `draft-outreach` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft a cold-call script for {Acme}. Use the draft-outreach skill with stage=cold-script. Structure: 15-second opener, pattern-interrupt (one specific observation unique to them), 2 discovery questions matched to the weakest qualification pillar for their segment, soft CTA (15m next week), and one landmine to avoid from call-insights. Save to outreach/script-{lead-slug}-{YYYY-MM-DD}.md.
```
