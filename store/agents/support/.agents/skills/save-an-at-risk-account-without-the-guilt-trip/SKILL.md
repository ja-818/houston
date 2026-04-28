---
name: save-an-at-risk-account-without-the-guilt-trip
description: "I pull the exact risk signal, acknowledge the pain honestly, and offer pause / downgrade / concierge / refund - whichever is policy in your support context. No guilt, no fake scarcity."
version: 1
tags: ["support", "overview-action", "draft-lifecycle-message"]
category: "Success"
featured: yes
integrations: ["hubspot", "attio", "stripe", "mailchimp", "customerio", "loops"]
image: "headphone"
---


# Save an at-risk account without the guilt trip
**Use when:** Pause / downgrade / concierge / refund  -  genuine options.
**What it does:** I pull the exact risk signal, acknowledge the pain honestly, and offer pause / downgrade / concierge / refund  -  whichever is policy in your support context. No guilt, no fake scarcity.
**Outcome:** Save at `saves/{account}.md`. Send from your own inbox.
## Instructions
Run this as a user-facing action. Use the underlying `draft-lifecycle-message` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft a save message for {account}. Use the draft-lifecycle-message skill with type=churn-save. Chain customer-view view=churn-risk first to pull the exact flag. Acknowledge the risk honestly, name the specific pain, offer pause / downgrade / concierge / refund  -  whichever is policy in context/support-context.md. Never invent a discount I haven't pre-approved. Save to saves/{account}.md.
```
