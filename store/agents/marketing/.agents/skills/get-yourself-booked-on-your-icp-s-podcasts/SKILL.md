---
name: get-yourself-booked-on-your-icp-s-podcasts
description: "I identify target shows by audience fit (via Listen Notes) and draft per-show pitches: hook based on your positioning, angle, proof, clear ask. No template spam."
version: 1
tags: ["marketing", "overview-action", "pitch-podcast"]
category: "Social"
featured: yes
integrations: ["twitter"]
image: "megaphone"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Draft podcast outreach for 5 shows our ICP listens to. Use the pitch-podcast skill. Identify target shows by audience fit via Listen Notes and draft per-show pitches: hook based on my positioning, angle, proof, clear ask. No template spam. Save to podcast-pitches/{{date}}.md.
---


# Get yourself booked on your ICP's podcasts
**Use when:** Per-show pitches  -  hook, angle, proof, ask.
**What it does:** I identify target shows by audience fit (via Listen Notes) and draft per-show pitches: hook based on your positioning, angle, proof, clear ask. No template spam.
**Outcome:** Pitches at podcast-pitches/{date}.md  -  one per show, send from your own email.
## Instructions
Run this as a user-facing action. Use the underlying `pitch-podcast` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft podcast outreach for 5 shows our ICP listens to. Use the pitch-podcast skill. Identify target shows by audience fit via Listen Notes and draft per-show pitches: hook based on my positioning, angle, proof, clear ask. No template spam. Save to podcast-pitches/{YYYY-MM-DD}.md.
```
