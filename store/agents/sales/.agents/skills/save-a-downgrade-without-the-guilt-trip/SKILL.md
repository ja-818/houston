---
name: save-a-downgrade-without-the-guilt-trip
description: "Non-defensive save that names the specific signal (downgrade, usage drop, support escalation) and offers one concrete remedy matching it - pause, downgrade further, concierge help, or refund. No guilt tactics."
version: 1
tags: ["sales", "overview-action", "draft-outreach"]
category: "Retention"
featured: yes
integrations: ["googlecalendar", "gmail", "outlook", "hubspot", "salesforce", "attio", "pipedrive", "gong", "fireflies", "stripe"]
image: "handshake"
inputs:
  - name: customer
    label: "Customer"
  - name: slug
    label: "Slug"
    required: false
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Draft a save for {{customer}}. Use the draft-outreach skill with stage=churn-save. Pull the downgrade / cancel / usage-drop signal from Stripe (via Composio) or what I paste. Structure: name the specific signal verbatim → one concrete remedy (pause, downgrade further, concierge help, refund  -  the genuine option that matches the signal) → proposed dated next step. No guilt tactics. Save to customers/{{slug}}/save-{{date}}.md.
---


# Save a downgrade without the guilt trip
**Use when:** Name the signal · offer one concrete remedy.
**What it does:** Non-defensive save that names the specific signal (downgrade, usage drop, support escalation) and offers one concrete remedy matching it  -  pause, downgrade further, concierge help, or refund. No guilt tactics.
**Outcome:** Save at customers/{slug}/save-{date}.md.
## Instructions
Run this as a user-facing action. Use the underlying `draft-outreach` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft a save for {customer}. Use the draft-outreach skill with stage=churn-save. Pull the downgrade / cancel / usage-drop signal from Stripe (via Composio) or what I paste. Structure: name the specific signal verbatim → one concrete remedy (pause, downgrade further, concierge help, refund  -  the genuine option that matches the signal) → proposed dated next step. No guilt tactics. Save to customers/{slug}/save-{YYYY-MM-DD}.md.
```
