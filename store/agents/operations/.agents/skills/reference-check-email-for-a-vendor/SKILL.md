---
name: reference-check-email-for-a-vendor
description: "3-5 targeted questions keyed to what we're evaluating - not 'tell me about them.' Saved as an inbox draft."
version: 1
tags: ["operations", "overview-action", "draft-message"]
category: "Vendors"
featured: yes
integrations: ["gmail", "outlook"]
image: "clipboard"
---


# Reference-check email for a vendor
**Use when:** 3-5 targeted questions keyed to what we're evaluating.
**What it does:** 3-5 targeted questions keyed to what we're evaluating  -  not 'tell me about them.' Saved as an inbox draft.
**Outcome:** Draft at drafts/vendor-reference-check-{vendor}.md + inbox draft.
## Instructions
Run this as a user-facing action. Use the underlying `draft-message` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft a reference-check email for {vendor}. Use the draft-message skill with type=vendor (sub-type=reference-check). 3-5 targeted questions based on what we're evaluating against  -  not 'tell me about them.' Save as an inbox draft + drafts/vendor-reference-check-{vendor}.md.
```
