---
name: package-an-ip-related-escalation-for-counsel
description: "Structured brief for an outside IP attorney: 2-3 sentence matter summary, numbered questions, deadline, quoted excerpts with cite, entity snapshot, recommended firm type (IP). Never names specific firms."
version: 1
tags: ["legal", "overview-action", "draft-document"]
category: "IP"
featured: yes
integrations: ["googledocs", "googledrive", "notion", "firecrawl"]
image: "scroll"
---


# Package an IP-related escalation for counsel
**Use when:** Structured brief  -  questions, quotes, deadline, firm type.
**What it does:** Structured brief for an outside IP attorney: 2-3 sentence matter summary, numbered questions, deadline, quoted excerpts with cite, entity snapshot, recommended firm type (IP). Never names specific firms.
**Outcome:** Brief at escalations/{matter}-{date}.md ready to email counsel.
## Instructions
Run this as a user-facing action. Use the underlying `draft-document` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Package this IP matter for outside counsel. Use the draft-document skill with type=escalation-brief. Structure: 2-3 sentence matter summary, numbered questions for the lawyer, deadline + why, quoted excerpts with cite, entity snapshot, recommended firm type (IP). Save to escalations/{matter-slug}-{YYYY-MM-DD}.md. Never names specific firms.
```
