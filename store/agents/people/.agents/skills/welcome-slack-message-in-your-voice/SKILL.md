---
name: welcome-slack-message-in-your-voice
description: "Warm, specific Day-0 Slack message in your voice (pulled from your context doc's voice notes). Slotted into the full onboarding plan file."
version: 1
tags: ["people", "overview-action", "draft-onboarding-plan"]
category: "Onboarding"
featured: yes
integrations: ["gmail", "notion", "slack"]
image: "busts-in-silhouette"
---


# Welcome Slack message in your voice
**Use when:** Day-0 ping  -  warm, specific, not corporate.
**What it does:** Warm, specific Day-0 Slack message in your voice (pulled from your context doc's voice notes). Slotted into the full onboarding plan file.
**Outcome:** Welcome Slack draft at onboarding-plans/{slug}.md. Copy-paste into #general on Day 0.
## Instructions
Run this as a user-facing action. Use the underlying `draft-onboarding-plan` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft the Day-0 welcome Slack for {new hire}. Use the draft-onboarding-plan skill and return just the Slack portion  -  warm, specific to their role, in my voice (pulled from context/people-context.md). Write to onboarding-plans/{employee-slug}.md under the `## Welcome Slack` section.
```
