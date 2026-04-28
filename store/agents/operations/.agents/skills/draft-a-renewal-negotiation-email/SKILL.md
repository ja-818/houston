---
name: draft-a-renewal-negotiation-email
description: "Grounded in the contract terms + your vendor posture: lead with data, specific ask (price, term), clean walk-away. Saved as an inbox draft - you approve and send."
version: 1
tags: ["operations", "overview-action", "draft-message"]
category: "Finance"
featured: yes
integrations: ["gmail", "outlook"]
image: "clipboard"
---


# Draft a renewal-negotiation email
**Use when:** Grounded in contract terms + usage + your posture.
**What it does:** Grounded in the contract terms + your vendor posture: lead with data, specific ask (price, term), clean walk-away. Saved as an inbox draft  -  you approve and send.
**Outcome:** Draft at drafts/vendor-renewal-{vendor}.md + inbox draft.
## Instructions
Run this as a user-facing action. Use the underlying `draft-message` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft a renewal-negotiation email for {vendor}. Use the draft-message skill with type=vendor (sub-type=renewal). Ground in contract terms from contracts/{vendor}/ and my vendor posture from context/operations-context.md (risk appetite, signature authority, paper preference). Lead with data, specific ask, walk-away. Save as inbox draft + drafts/vendor-renewal-{vendor}.md.
```
