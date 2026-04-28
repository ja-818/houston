---
name: draft-trial-outreach-to-a-supplier
description: "Positioning fit + specific use case + success criteria + honest timeline. Saved as an inbox draft."
version: 1
tags: ["operations", "overview-action", "draft-message"]
category: "Vendors"
featured: yes
integrations: ["gmail", "outlook"]
image: "clipboard"
---


# Draft trial outreach to a supplier
**Use when:** Positioning fit + use case + success criteria + timeline.
**What it does:** Positioning fit + specific use case + success criteria + honest timeline. Saved as an inbox draft.
**Outcome:** Draft at drafts/vendor-trial-{supplier}.md + inbox draft.
## Instructions
Run this as a user-facing action. Use the underlying `draft-message` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Reach out to {supplier} for a trial. Use the draft-message skill with type=vendor (sub-type=trial). Write: positioning fit + specific use case + success criteria + honest timeline. Save as an inbox draft + drafts/vendor-trial-{supplier}.md.
```
