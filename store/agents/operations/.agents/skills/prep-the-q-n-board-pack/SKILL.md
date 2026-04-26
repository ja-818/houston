---
name: prep-the-q-n-board-pack
description: "Draft the full 8-section board pack (TL;DR, business update, metrics, OKRs, wins, challenges, asks, appendix) from everything this agent has produced. Flags every TBD."
version: 1
tags: ["operations", "overview-action", "prep-package"]
category: "Planning"
featured: yes
integrations: ["googledocs", "googledrive", "notion"]
image: "clipboard"
inputs:
  - name: n
    label: "N"
    required: false
  - name: quarter
    label: "Quarter"
    placeholder: "e.g. 2026-Q1"
prompt_template: |
  Prep the Q{{n}} board pack. Use the prep-package skill with type=board-pack. Draft the standard 8 sections (TL;DR, business update, metrics, OKRs, wins, challenges, asks, appendix) from my outputs.json + okr-history.json + decisions.json + metrics-daily.json. Flag every TBD. Save to board-packs/{{quarter}}/board-pack.md with an optional Google Docs mirror if connected.
---


# Prep the Q{N} board pack
**Use when:** TL;DR, business update, metrics, OKRs, wins, challenges, asks.
**What it does:** Draft the full 8-section board pack (TL;DR, business update, metrics, OKRs, wins, challenges, asks, appendix) from everything this agent has produced. Flags every TBD.
**Outcome:** Pack at board-packs/{yyyy-qq}/board-pack.md (+ Google Doc mirror if connected).
## Instructions
Run this as a user-facing action. Use the underlying `prep-package` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Prep the Q{N} board pack. Use the prep-package skill with type=board-pack. Draft the standard 8 sections (TL;DR, business update, metrics, OKRs, wins, challenges, asks, appendix) from my outputs.json + okr-history.json + decisions.json + metrics-daily.json. Flag every TBD. Save to board-packs/{yyyy-qq}/board-pack.md with an optional Google Docs mirror if connected.
```
