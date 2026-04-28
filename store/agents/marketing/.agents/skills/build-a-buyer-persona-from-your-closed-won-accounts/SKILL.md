---
name: build-a-buyer-persona-from-your-closed-won-accounts
description: "Pull top closed-won accounts from your connected CRM (HubSpot / Attio / Salesforce) and synthesize a persona with JTBD, pains ranked by frequency, triggers, objection patterns, and anchor accounts."
version: 1
tags: ["marketing", "overview-action", "profile-icp"]
category: "Positioning"
featured: yes
integrations: ["hubspot", "salesforce", "attio"]
image: "megaphone"
---


# Build a buyer persona from your closed-won accounts
**Use when:** Real JTBD, pains, triggers  -  pulled from your CRM.
**What it does:** Pull top closed-won accounts from your connected CRM (HubSpot / Attio / Salesforce) and synthesize a persona with JTBD, pains ranked by frequency, triggers, objection patterns, and anchor accounts.
**Outcome:** Persona at personas/{slug}.md  -  the foundation ad copy and landing pages pull from.
## Instructions
Run this as a user-facing action. Use the underlying `profile-icp` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Build a buyer persona for {segment}. Use the profile-icp skill. Pull my top closed-won accounts from my connected CRM (HubSpot / Attio / Salesforce via Composio), extract common firmographics, roles, and decision-maker patterns, then synthesize pains ranked by frequency, jobs-to-be-done, triggers that mean they're in-market, objection patterns, and 1–2 anchor accounts. Save to personas/{slug}.md.
```
