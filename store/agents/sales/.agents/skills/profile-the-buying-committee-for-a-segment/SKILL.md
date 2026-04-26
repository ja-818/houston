---
name: profile-the-buying-committee-for-a-segment
description: "Pull top closed-won accounts from your connected CRM and synthesize a sales-flavored persona: champion, economic buyer, blocker, disqualifiers, anchor accounts - the foundation every call prep pulls from."
version: 1
tags: ["sales", "overview-action", "profile-icp"]
category: "Playbook"
featured: yes
integrations: ["hubspot", "salesforce", "attio", "pipedrive"]
image: "handshake"
inputs:
  - name: segment
    label: "Segment"
  - name: segment_slug
    label: "Segment Slug"
    required: false
prompt_template: |
  Profile the buying committee for {{segment}}. Use the profile-icp skill. Pull top closed-won accounts from my connected CRM (HubSpot / Salesforce / Attio / Pipedrive / Close via Composio), identify the champion (title + motivations), economic buyer (title + what wins them), blocker (who kills deals + why), and influencers. Save to personas/{{segment_slug}}.md.
---


# Profile the buying committee for a segment
**Use when:** Champion, economic buyer, blocker, disqualifiers.
**What it does:** Pull top closed-won accounts from your connected CRM and synthesize a sales-flavored persona: champion, economic buyer, blocker, disqualifiers, anchor accounts  -  the foundation every call prep pulls from.
**Outcome:** Persona at personas/{segment}.md  -  the foundation call prep + proposals pull from.
## Instructions
Run this as a user-facing action. Use the underlying `profile-icp` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Profile the buying committee for {segment}. Use the profile-icp skill. Pull top closed-won accounts from my connected CRM (HubSpot / Salesforce / Attio / Pipedrive / Close via Composio), identify the champion (title + motivations), economic buyer (title + what wins them), blocker (who kills deals + why), and influencers. Save to personas/{segment-slug}.md.
```
