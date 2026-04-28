---
name: build-a-mutual-action-plan-with-acme
description: "Shared timeline across procurement / security / budget / legal with owners + dates - stitched from your call analyses. Top 3 deal risks surfaced."
version: 1
tags: ["sales", "overview-action", "draft-close-plan"]
category: "Meetings"
featured: yes
integrations: ["attio", "firecrawl", "fireflies", "gmail", "gong", "googlecalendar", "googledocs", "hubspot", "linear", "linkedin", "notion", "outlook", "perplexityai", "pipedrive", "reddit", "salesforce", "stripe", "twitter"]
image: "handshake"
---


# Build a mutual action plan with {Acme}
**Use when:** Procurement, security, budget, owners, dates.
**What it does:** Shared timeline across procurement / security / budget / legal with owners + dates  -  stitched from your call analyses. Top 3 deal risks surfaced.
**Outcome:** Close plan at deals/{slug}/close-plan.md with top 3 risks.
## Instructions
Run this as a user-facing action. Use the underlying `draft-close-plan` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Build a mutual action plan with {Acme}. Use the draft-close-plan skill. Stitch the call analyses into a shared timeline with procurement, security review, budget approval, legal, owners (ours + theirs), and target dates. Surface the top 3 risks. Save to deals/{slug}/close-plan.md.
```
