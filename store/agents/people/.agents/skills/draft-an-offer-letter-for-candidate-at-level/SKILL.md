---
name: draft-an-offer-letter-for-candidate-at-level
description: "Reads comp bands, equity stance, leveling, and voice from your context doc, drafts the offer letter at offers/{slug}.md as a draft. Never sent."
version: 1
tags: ["people", "overview-action", "draft-offer"]
category: "Hiring"
featured: yes
integrations: ["googledocs", "notion", "loops"]
image: "busts-in-silhouette"
inputs:
  - name: candidate
    label: "Candidate"
  - name: level
    label: "Level"
  - name: candidate_slug
    label: "Candidate Slug"
    required: false
prompt_template: |
  Draft an offer letter for {{candidate}} at {{level}}. Use the draft-offer skill. Read comp bands, equity stance, and leveling from context/people-context.md plus voice from the ledger. Write to offers/{{candidate_slug}}.md as status draft. Never sent.
---


# Draft an offer letter for {candidate} at {level}
**Use when:** Comp + equity pulled from your bands. Never sent.
**What it does:** Reads comp bands, equity stance, leveling, and voice from your context doc, drafts the offer letter at offers/{slug}.md as a draft. Never sent.
**Outcome:** Offer draft at offers/{slug}.md. You review, flip to ready, send.
## Instructions
Run this as a user-facing action. Use the underlying `draft-offer` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft an offer letter for {candidate} at {level}. Use the draft-offer skill. Read comp bands, equity stance, and leveling from context/people-context.md plus voice from the ledger. Write to offers/{candidate-slug}.md as status draft. Never sent.
```
