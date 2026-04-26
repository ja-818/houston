---
name: save-a-downgrade-without-the-guilt-trip
description: "No guilt tactics, no fake scarcity. Offer a genuine option (pause / downgrade further / concierge help / refund). Tone matches your voice."
version: 1
tags: ["marketing", "overview-action", "plan-campaign"]
category: "Email"
featured: yes
integrations: ["hubspot", "stripe", "linkedin", "mailchimp", "customerio", "googleads", "metaads"]
image: "megaphone"
inputs:
  - name: persona
    label: "Persona"
prompt_template: |
  Draft a save email for accounts that downgraded. Use the plan-campaign skill with type=churn-save. Pull the downgrade signal from my connected Stripe / HubSpot if available. No guilt tactics, no fake scarcity. Offer a genuine option (pause / downgrade further / concierge help / refund). Tone matches my voice. Save to campaigns/churn-save-{{persona}}.md.
---


# Save a downgrade without the guilt trip
**Use when:** Genuine option  -  pause / downgrade / concierge / refund.
**What it does:** No guilt tactics, no fake scarcity. Offer a genuine option (pause / downgrade further / concierge help / refund). Tone matches your voice.
**Outcome:** Save email at campaigns/churn-save-{persona}.md.
## Instructions
Run this as a user-facing action. Use the underlying `plan-campaign` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft a save email for accounts that downgraded. Use the plan-campaign skill with type=churn-save. Pull the downgrade signal from my connected Stripe / HubSpot if available. No guilt tactics, no fake scarcity. Offer a genuine option (pause / downgrade further / concierge help / refund). Tone matches my voice. Save to campaigns/churn-save-{persona}.md.
```
