---
name: draft-a-board-consent-for-a-routine-action
description: "Draft board consent for routine corporate actions (officer appointment, option grant, 409A adoption, bank resolution). Uses your entity snapshot. Flags attorney review if share math is non-standard."
version: 1
tags: ["legal", "overview-action", "draft-document"]
category: "Entity"
featured: yes
integrations: ["googledocs", "googledrive", "notion", "firecrawl"]
image: "scroll"
---


# Draft a board consent for a routine action
**Use when:** Officer appt, option grant, 409A adoption, bank res.
**What it does:** Draft board consent for routine corporate actions (officer appointment, option grant, 409A adoption, bank resolution). Uses your entity snapshot. Flags attorney review if share math is non-standard.
**Outcome:** Draft at drafts/board-consent/{action}-{date}.md.
## Instructions
Run this as a user-facing action. Use the underlying `draft-document` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft a board consent for {action} (officer appointment / option grant / 409A adoption / bank resolution). Use the draft-document skill with type=board-consent. Pull directors + authorized shares from universal.entity, substitute the action-specific variables, produce the consent. Save to drafts/board-consent/{action-slug}-{YYYY-MM-DD}.md. Flags attorney review if share math is non-standard.
```
