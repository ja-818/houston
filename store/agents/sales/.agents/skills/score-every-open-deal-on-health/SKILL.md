---
name: score-every-open-deal-on-health
description: "Three-driver score per open deal: time-in-stage vs playbook baseline · qualification-pillar coverage · touch recency. Each row shows the driver that tipped it - no black-box numbers."
version: 1
tags: ["sales", "overview-action", "score"]
category: "CRM"
featured: yes
integrations: ["hubspot", "salesforce", "attio", "stripe"]
image: "handshake"
---


# Score every open deal on health
**Use when:** Time-in-stage · qualification · touch recency.
**What it does:** Three-driver score per open deal: time-in-stage vs playbook baseline · qualification-pillar coverage · touch recency. Each row shows the driver that tipped it  -  no black-box numbers.
**Outcome:** Scored deals at scores/deal-health-{date}.md + updated deals.json.
## Instructions
Run this as a user-facing action. Use the underlying `score` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Score my open deals on health. Use the score skill with subject=deal-health. For each open deal in deals.json + connected CRM, score three drivers: time-in-stage vs playbook baseline, qualification-pillar coverage, touch recency. Return per-deal GREEN / YELLOW / RED with drivers named. Save to scores/deal-health-{YYYY-MM-DD}.md and update deals.json.
```
