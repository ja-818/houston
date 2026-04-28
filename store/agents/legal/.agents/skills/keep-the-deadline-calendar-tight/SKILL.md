---
name: keep-the-deadline-calendar-tight
description: "Seeds the canonical legal calendar (Delaware March 1, 83(b) 30-day, 409A 12-month, DSR 30/45-day, TM 6-month, annual board consent) + enriches with renewal clocks from counterparty-tracker.json. Every deadline cites its authority."
version: 1
tags: ["legal", "overview-action", "track-legal-state"]
category: "Compliance"
featured: yes
integrations: ["googledrive", "gmail", "notion"]
image: "scroll"
---


# Keep the deadline calendar tight
**Use when:** DE March 1, 83(b) 30-day, 409A, DSR  -  all cited.
**What it does:** Seeds the canonical legal calendar (Delaware March 1, 83(b) 30-day, 409A 12-month, DSR 30/45-day, TM 6-month, annual board consent) + enriches with renewal clocks from counterparty-tracker.json. Every deadline cites its authority.
**Outcome:** 90-day readout at deadline-summaries/{date}.md + deadline-calendar.json.
## Instructions
Run this as a user-facing action. Use the underlying `track-legal-state` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Refresh my legal deadline calendar. Use the track-legal-state skill with scope=deadlines. Seed from the canonical set (Delaware March 1, 83(b) 30-day, 409A 12-month, DSR 30/45-day, TM office action 6-month, annual board consent) + enrich with dynamic renewal clocks from counterparty-tracker.json. Cite the authority for each. Save to deadline-summaries/{YYYY-MM-DD}.md + update deadline-calendar.json.
```
