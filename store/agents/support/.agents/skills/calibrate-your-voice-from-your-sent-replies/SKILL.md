---
name: calibrate-your-voice-from-your-sent-replies
description: "I pull 10-20 outbound replies from your connected inbox (Gmail / Outlook / Intercom / Help Scout), extract tone cues, and write `config/voice.md`. Every reply draft and KB article this agent writes reads this."
version: 1
tags: ["support", "overview-action", "voice-calibration"]
category: "Quality"
featured: yes
integrations: ["gmail", "outlook"]
image: "headphone"
---


# Calibrate your voice from your sent replies
**Use when:** Pulls 10-20 outbound messages  -  no corporate hedging.
**What it does:** I pull 10-20 outbound replies from your connected inbox (Gmail / Outlook / Intercom / Help Scout), extract tone cues, and write `config/voice.md`. Every reply draft and KB article this agent writes reads this.
**Outcome:** Voice profile at `config/voice.md`  -  drafts stop sounding like AI.
## Instructions
Run this as a user-facing action. Use the underlying `voice-calibration` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Calibrate my voice. Use the voice-calibration skill. Pull 10-20 of my recent outbound support replies from my connected inbox (Gmail / Outlook / Intercom / Help Scout via Composio), extract tone cues (greeting, sign-off, sentence length, quirks, forbidden phrases), and write config/voice.md. Every draft-reply and write-article in this agent reads this.
```
