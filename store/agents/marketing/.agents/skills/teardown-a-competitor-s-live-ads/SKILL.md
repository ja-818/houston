---
name: teardown-a-competitor-s-live-ads
description: "I pull live creative from Meta Ad Library, LinkedIn Ad Library, and Google Ads Transparency (via Composio scrape), then extract the angles, hooks, and offers they're testing."
version: 1
tags: ["marketing", "overview-action", "monitor-competitors"]
category: "Paid"
featured: yes
integrations: ["linkedin", "twitter", "reddit", "instagram", "googleads", "metaads", "firecrawl"]
image: "megaphone"
inputs:
  - name: competitor
    label: "Competitor"
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Teardown {{competitor}}'s current ads. Use the monitor-competitors skill with source=ads. Pull live creative from Meta Ad Library, LinkedIn Ad Library, and Google Ads Transparency (via Composio scrape), then extract angles, hooks, and offers they're testing. Save to competitor-briefs/ads-{{competitor}}-{{date}}.md.
---


# Teardown a competitor's live ads
**Use when:** Angles, hooks, offers they're testing right now.
**What it does:** I pull live creative from Meta Ad Library, LinkedIn Ad Library, and Google Ads Transparency (via Composio scrape), then extract the angles, hooks, and offers they're testing.
**Outcome:** Ad teardown at competitor-briefs/ads-{competitor}-{date}.md  -  research for your own ad copy.
## Instructions
Run this as a user-facing action. Use the underlying `monitor-competitors` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Teardown {competitor}'s current ads. Use the monitor-competitors skill with source=ads. Pull live creative from Meta Ad Library, LinkedIn Ad Library, and Google Ads Transparency (via Composio scrape), then extract angles, hooks, and offers they're testing. Save to competitor-briefs/ads-{competitor}-{YYYY-MM-DD}.md.
```
