---
name: set-up-your-support-context-the-source-of-truth
description: "I interview you briefly and write `context/support-context.md` - product overview, segments + VIPs, tone, SLA tiers, routing rules, known gotchas. Every other skill reads it first."
version: 1
tags: ["support", "overview-action", "define-support-context"]
category: "Quality"
featured: yes
integrations: ["googledocs", "stripe", "notion", "github", "linear"]
image: "headphone"
---


# Set up your support context  -  the source of truth
**Use when:** Voice, SLAs, routing, VIPs, known gotchas.
**What it does:** I interview you briefly and write `context/support-context.md`  -  product overview, segments + VIPs, tone, SLA tiers, routing rules, known gotchas. Every other skill reads it first.
**Outcome:** Locked doc at `context/support-context.md`  -  the source of truth.
## Instructions
Run this as a user-facing action. Use the underlying `define-support-context` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Help me set up my support context. Use the define-support-context skill. Interview me briefly, then write context/support-context.md  -  product overview, customer segments + VIPs, tone + voice, SLA tiers, routing rules, known gotchas. Every other skill in this agent reads it before substantive work.
```
