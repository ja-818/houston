---
name: draft-this-month-s-investor-update
description: "CEO-voice narrative grounded in OKR movement, decisions, and metrics. Highlights, honest lowlights, asks, closing - all voice-matched to your samples."
version: 1
tags: ["operations", "overview-action", "prep-package"]
category: "Planning"
featured: yes
integrations: ["googledocs", "googledrive", "notion"]
image: "clipboard"
inputs:
  - name: quarter
    label: "Quarter"
    placeholder: "e.g. 2026-Q1"
prompt_template: |
  Draft the monthly investor update. Use the prep-package skill with type=investor-update. CEO-voice narrative ~600-900 words: opening, highlights (3-5), lowlights (1-2), KR status block, asks (2-3), closing. Voice-matched from config/voice.md. Save to investor-updates/{{quarter}}/update.md.
---


# Draft this month's investor update
**Use when:** CEO-voice narrative grounded in OKRs + decisions + metrics.
**What it does:** CEO-voice narrative grounded in OKR movement, decisions, and metrics. Highlights, honest lowlights, asks, closing  -  all voice-matched to your samples.
**Outcome:** Update at investor-updates/{yyyy-qq}/update.md.
## Instructions
Run this as a user-facing action. Use the underlying `prep-package` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft the monthly investor update. Use the prep-package skill with type=investor-update. CEO-voice narrative ~600-900 words: opening, highlights (3-5), lowlights (1-2), KR status block, asks (2-3), closing. Voice-matched from config/voice.md. Save to investor-updates/{yyyy-qq}/update.md.
```
