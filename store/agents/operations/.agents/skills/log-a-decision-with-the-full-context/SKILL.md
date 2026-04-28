---
name: log-a-decision-with-the-full-context
description: "I write an ADR-style decision record with context, alternatives, trade-offs, rationale, and consequences - the thing you'll wish you had written 6 months from now."
version: 1
tags: ["operations", "overview-action", "log-decision"]
category: "Planning"
featured: yes
integrations: ["linkedin"]
image: "clipboard"
---


# Log a decision with the full context
**Use when:** ADR-style: alternatives, trade-offs, rationale, consequences.
**What it does:** I write an ADR-style decision record with context, alternatives, trade-offs, rationale, and consequences  -  the thing you'll wish you had written 6 months from now.
**Outcome:** Record at decisions/{slug}/decision.md and row in decisions.json.
## Instructions
Run this as a user-facing action. Use the underlying `log-decision` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Log this decision. Use the log-decision skill. Write an ADR-style record with context, alternatives considered, trade-offs, the decision, rationale, consequences, and links to related initiatives. Save to decisions/{slug}/decision.md and append to decisions.json.
```
