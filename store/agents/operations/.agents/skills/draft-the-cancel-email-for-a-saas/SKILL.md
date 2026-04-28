---
name: draft-the-cancel-email-for-a-saas
description: "Direct, grateful, and specific - cites the cancellation clause and effective date from the contract. Saved as an inbox draft."
version: 1
tags: ["operations", "overview-action", "draft-message"]
category: "Finance"
featured: yes
integrations: ["gmail", "outlook"]
image: "clipboard"
---


# Draft the cancel email for a SaaS
**Use when:** Direct, grateful, cites the clause + effective date.
**What it does:** Direct, grateful, and specific  -  cites the cancellation clause and effective date from the contract. Saved as an inbox draft.
**Outcome:** Draft at drafts/vendor-cancel-{vendor}.md + inbox draft.
## Instructions
Run this as a user-facing action. Use the underlying `draft-message` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Write the cancel email for {SaaS}. Use the draft-message skill with type=vendor (sub-type=cancel). Direct, grateful, cites the cancellation clause + effective date from the contract. Save as an inbox draft + drafts/vendor-cancel-{vendor}.md.
```
