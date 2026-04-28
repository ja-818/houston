---
name: find-20-new-leads-in-a-segment
description: "I surface net-new leads from your connected sources or public intent signals (CRM lookalikes, LinkedIn threads, recent-funding feeds, Google Maps, subreddits). Each lead has the trigger signal cited - no generic lists."
version: 1
tags: ["sales", "overview-action", "find-leads"]
category: "Outbound"
featured: yes
integrations: ["hubspot", "salesforce", "attio", "linkedin", "twitter", "reddit", "firecrawl"]
image: "handshake"
---


# Find 20 new leads in a segment
**Use when:** CRM lookalikes, funding signals, LinkedIn threads, Google Maps.
**What it does:** I surface net-new leads from your connected sources or public intent signals (CRM lookalikes, LinkedIn threads, recent-funding feeds, Google Maps, subreddits). Each lead has the trigger signal cited  -  no generic lists.
**Outcome:** Batch at leads/batches/{segment}-{date}.md + new rows in leads.json.
## Instructions
Run this as a user-facing action. Use the underlying `find-leads` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Find me 20 leads in {segment}. Use the find-leads skill. Pick a source that fits the segment: my connected CRM for lookalikes of closed-won, a LinkedIn comment thread, recent-funding / recent-hire feeds, Google Maps for local biz, or a subreddit. Quick-score each against the playbook's disqualifiers, drop REDs, save GREEN + YELLOW to leads.json with the trigger signal cited per lead. Write the batch to leads/batches/{segment-slug}-{YYYY-MM-DD}.md.
```
