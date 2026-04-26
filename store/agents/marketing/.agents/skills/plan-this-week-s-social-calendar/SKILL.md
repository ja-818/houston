---
name: plan-this-week-s-social-calendar
description: "Mon–Fri plan per platform (LinkedIn / X / Reddit), keyed to your topics, mixing original posts with repurposed content from this agent's outputs (zero duplicate angles)."
version: 1
tags: ["marketing", "overview-action", "plan-social-calendar"]
category: "Social"
featured: yes
integrations: ["linkedin", "twitter", "reddit", "youtube"]
image: "megaphone"
inputs:
  - name: week
    label: "Week"
    placeholder: "e.g. 2026-W14"
prompt_template: |
  Plan this week's social content across LinkedIn and X. Use the plan-social-calendar skill. Mon–Fri per platform, keyed to my topics, mixing original posts with repurposed content from outputs.json (zero duplicate angles). Save to social-calendars/{{week}}.md and append to social-calendar.md.
---


# Plan this week's social calendar
**Use when:** Mon–Fri per platform, mixing new + repurposed.
**What it does:** Mon–Fri plan per platform (LinkedIn / X / Reddit), keyed to your topics, mixing original posts with repurposed content from this agent's outputs (zero duplicate angles).
**Outcome:** Calendar at social-calendars/{YYYY-WNN}.md + appended to living social-calendar.md.
## Instructions
Run this as a user-facing action. Use the underlying `plan-social-calendar` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Plan this week's social content across LinkedIn and X. Use the plan-social-calendar skill. Mon–Fri per platform, keyed to my topics, mixing original posts with repurposed content from outputs.json (zero duplicate angles). Save to social-calendars/{YYYY-WNN}.md and append to social-calendar.md.
```
