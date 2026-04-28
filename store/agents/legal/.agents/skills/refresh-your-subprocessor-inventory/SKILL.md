---
name: refresh-your-subprocessor-inventory
description: "Walks your connected integrations + landing-page scripts, captures each vendor's role + data categories + transfer mechanism + DPA status + public DPA URL, and refreshes subprocessor-inventory.json with a delta report."
version: 1
tags: ["legal", "overview-action", "audit-compliance"]
category: "Compliance"
featured: yes
integrations: ["googledocs", "googledrive", "stripe", "firecrawl"]
image: "scroll"
---


# Refresh your subprocessor inventory
**Use when:** Walks integrations + landing, captures DPA status.
**What it does:** Walks your connected integrations + landing-page scripts, captures each vendor's role + data categories + transfer mechanism + DPA status + public DPA URL, and refreshes subprocessor-inventory.json with a delta report.
**Outcome:** Delta report at subprocessor-reviews/{date}.md + updated inventory.
## Instructions
Run this as a user-facing action. Use the underlying `audit-compliance` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Refresh my subprocessor inventory. Use the audit-compliance skill with scope=subprocessors. Walk my connected integrations + scrape my landing page for vendor clues, capture role + data categories + transfer mechanism + DPA status + public DPA URL per vendor. Read-merge-write subprocessor-inventory.json + save a delta report to subprocessor-reviews/{YYYY-MM-DD}.md.
```
