---
name: refresh-articles-wrong-since-your-last-ship
description: "I scan every article for references to what changed (pricing / UI / feature name), write the proposed rewrite diff, and mark articles `needsReview: true` in `outputs.json`."
version: 1
tags: ["support", "overview-action", "write-article"]
category: "Help Center"
featured: yes
integrations: ["googledocs", "notion", "github", "linear"]
image: "headphone"
---


# Refresh articles wrong since your last ship
**Use when:** Scans KB for stale pricing, UI, feature names.
**What it does:** I scan every article for references to what changed (pricing / UI / feature name), write the proposed rewrite diff, and mark articles `needsReview: true` in `outputs.json`.
**Outcome:** Proposed rewrites across `articles/`  -  review diffs one at a time.
## Instructions
Run this as a user-facing action. Use the underlying `write-article` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Refresh help-center articles affected by {change}. Use the write-article skill with type=refresh-stale. Scan every articles/{slug}.md for references to the changed element and write the proposed rewrite diff without overwriting. Mark the articles needsReview=true in outputs.json.
```
