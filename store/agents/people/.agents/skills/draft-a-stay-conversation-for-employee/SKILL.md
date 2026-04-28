---
name: draft-a-stay-conversation-for-employee
description: "Drafts a verbal 1:1 SCRIPT (not an email): Open → Listen → Surface → Ask → Propose. Filtered against your counter-offer policy and hard nos."
version: 1
tags: ["people", "overview-action", "draft-performance-doc"]
category: "Performance"
featured: yes
integrations: ["gmail", "slack"]
image: "busts-in-silhouette"
---


# Draft a stay conversation for {employee}
**Use when:** Verbal 1:1 script  -  Open · Listen · Surface · Ask · Propose.
**What it does:** Drafts a verbal 1:1 SCRIPT (not an email): Open → Listen → Surface → Ask → Propose. Filtered against your counter-offer policy and hard nos.
**Outcome:** Script at performance-docs/stay-conversation-{slug}.md. Read it before the 1:1, adapt in the moment.
## Instructions
Run this as a user-facing action. Use the underlying `draft-performance-doc` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft a stay conversation for {employee}. Use the draft-performance-doc skill with type=stay-conversation. Read voice and hard-nos from context/people-context.md (especially counter-offer policy), pull the retention-score reasoning if present, and draft a verbal 1:1 SCRIPT: Open → Listen → Surface → Ask → Propose. Write to performance-docs/stay-conversation-{employee-slug}.md. This is a prompt for a verbal 1:1  -  do not send.
```
