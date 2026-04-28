---
name: coordinate-a-cross-phase-release
description: "I break the release into a sequenced per-phase checklist (design ready? deploy plan? tests green? runbook? release notes? user docs?) with exact copy-paste prompts for the skills in this agent that execute each phase."
version: 1
tags: ["engineering", "overview-action", "coordinate-release"]
category: "Planning"
featured: yes
integrations: ["discord", "firecrawl", "github", "gitlab", "jira", "linear", "loops", "notion", "perplexityai", "slack", "stripe", "twitter"]
image: "laptop"
---


# Coordinate a cross-phase release
**Use when:** Sequenced checklist across design, ship, ops, docs.
**What it does:** I break the release into a sequenced per-phase checklist (design ready? deploy plan? tests green? runbook? release notes? user docs?) with exact copy-paste prompts for the skills in this agent that execute each phase.
**Outcome:** A release plan at release-plans/{feature-slug}.md with a checklist per phase.
## Instructions
Run this as a user-facing action. Use the underlying `coordinate-release` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Coordinate the {feature} release. Use the coordinate-release skill. Break the release into a sequenced checklist across phases: Design (draft-design-doc done?), Ship (review-deploy-readiness GREEN? review-pr done on the PRs?), Ops (draft-runbook written? audit observability?), Docs (write-release-notes drafted? write-docs tutorial?). For every phase, write an exact copy-paste prompt I can send to trigger the relevant skill. Flag the critical path. Save to release-plans/{feature-slug}.md.
```
