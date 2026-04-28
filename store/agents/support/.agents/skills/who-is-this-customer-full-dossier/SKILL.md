---
name: who-is-this-customer-full-dossier
description: "Plan + MRR from your connected Stripe, profile from HubSpot / Attio / Salesforce, plus open bugs, open followups, churn flags, and last 3 conversations - all in one doc."
version: 1
tags: ["support", "overview-action", "customer-view"]
category: "Inbox"
featured: yes
integrations: ["gmail", "hubspot", "salesforce", "attio", "stripe"]
image: "headphone"
---


# Who is this customer  -  full dossier
**Use when:** Plan, MRR, open bugs, history  -  before you reply.
**What it does:** Plan + MRR from your connected Stripe, profile from HubSpot / Attio / Salesforce, plus open bugs, open followups, churn flags, and last 3 conversations  -  all in one doc.
**Outcome:** Dossier at `dossiers/{slug}.md`  -  the context `draft-reply` reads too.
## Instructions
Run this as a user-facing action. Use the underlying `customer-view` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Build the customer dossier for {customer}. Use the customer-view skill with view=dossier. Pull plan + MRR from my connected Stripe, profile from my connected CRM (HubSpot / Attio / Salesforce), and filter conversations.json + bug-candidates.json + followups.json + churn-flags.json to this customer. Save to dossiers/{slug}.md.
```
