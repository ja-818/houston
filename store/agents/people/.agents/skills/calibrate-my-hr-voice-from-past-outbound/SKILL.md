---
name: calibrate-my-hr-voice-from-past-outbound
description: "Pulls 10-20 HR outbound samples from Gmail or Outlook, extracts a tone fingerprint, appends it to your context doc. Every offer, PIP, and onboarding note drafts against it."
version: 1
tags: ["people", "overview-action", "voice-calibration"]
category: "Culture"
featured: yes
integrations: ["gmail", "outlook"]
image: "busts-in-silhouette"
inputs:
  - name: request
    label: "Additional context"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Calibrate my HR voice. Use the voice-calibration skill. Pull 10-20 of my recent HR-adjacent outbound messages from my connected Gmail (or Outlook), extract a tone fingerprint  -  greeting habits, closing habits, sentence length, formality, forbidden phrases, hard-news register  -  and append it to the voice-notes section of context/people-context.md. Also refresh config/voice.md.

  Additional context: {{request}}
---


# Calibrate my HR voice from past outbound
**Use when:** Offers, onboarding notes, rejections  -  tone fingerprint.
**What it does:** Pulls 10-20 HR outbound samples from Gmail or Outlook, extracts a tone fingerprint, appends it to your context doc. Every offer, PIP, and onboarding note drafts against it.
**Outcome:** Voice notes updated in context/people-context.md + config/voice.md. Downstream drafts sound like you.
## Instructions
Run this as a user-facing action. Use the underlying `voice-calibration` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Calibrate my HR voice. Use the voice-calibration skill. Pull 10-20 of my recent HR-adjacent outbound messages from my connected Gmail (or Outlook), extract a tone fingerprint  -  greeting habits, closing habits, sentence length, formality, forbidden phrases, hard-news register  -  and append it to the voice-notes section of context/people-context.md. Also refresh config/voice.md.
```
