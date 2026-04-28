---
name: draft-an-expansion-nudge-grounded-in-a-ceiling-signal
description: "I check `health-scores.json` for a real ceiling signal first. If found, I draft a short, specific outreach naming the signal. If not, I stop - no upsell pressure."
version: 1
tags: ["support", "overview-action", "draft-lifecycle-message"]
category: "Success"
featured: yes
integrations: ["hubspot", "attio", "stripe", "mailchimp", "customerio", "loops"]
image: "headphone"
---


# Draft an expansion nudge grounded in a ceiling signal
**Use when:** Real signal or I stop  -  no upsell spam.
**What it does:** I check `health-scores.json` for a real ceiling signal first. If found, I draft a short, specific outreach naming the signal. If not, I stop  -  no upsell pressure.
**Outcome:** Draft at `expansions/{account}.md`  -  or a clear 'no signal, don't push.'
## Instructions
Run this as a user-facing action. Use the underlying `draft-lifecycle-message` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft an expansion nudge for {account}. Use the draft-lifecycle-message skill with type=expansion-nudge. Chain customer-view view=health first to find the ceiling signal (feature-adoption threshold, team-size change, repeated ask). Draft a short, specific outreach naming the signal and proposing an option. If no real signal exists, stop and tell me. Save to expansions/{account}.md.
```
