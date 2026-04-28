---
name: plan-a-google-ads-search-campaign
description: "Full campaign brief: audience, keyword/placement strategy, ad-group structure, suggested budget, landing-page requirements, KPI targets."
version: 1
tags: ["marketing", "overview-action", "plan-campaign"]
category: "Paid"
featured: yes
integrations: ["hubspot", "stripe", "linkedin", "mailchimp", "customerio", "googleads", "metaads"]
image: "megaphone"
---


# Plan a Google Ads search campaign
**Use when:** Audience, ad-groups, budget, KPIs  -  before a dollar.
**What it does:** Full campaign brief: audience, keyword/placement strategy, ad-group structure, suggested budget, landing-page requirements, KPI targets.
**Outcome:** Campaign brief at campaigns/paid-{channel}-{slug}.md  -  spec before you spend a dollar.
## Instructions
Run this as a user-facing action. Use the underlying `plan-campaign` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Plan a Google Ads search campaign for {keyword cluster}. Use the plan-campaign skill with type=paid. Full brief: audience, keyword/placement strategy, ad-group structure, suggested budget, landing-page requirements, KPI targets. Save to campaigns/paid-{channel}-{slug}.md  -  spec the experiment before I spend a dollar.
```
