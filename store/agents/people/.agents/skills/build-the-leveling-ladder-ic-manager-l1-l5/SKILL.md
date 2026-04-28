---
name: build-the-leveling-ladder-ic-manager-l1-l5
description: "Scaffolds IC + manager tracks (L1-L5 default) inside your context doc - each level with scope, seniority markers, and a value-embodiment line tied to your company values."
version: 1
tags: ["people", "overview-action", "define-people-context"]
category: "Culture"
featured: yes
integrations: ["googlesheets", "googledocs", "notion"]
image: "busts-in-silhouette"
---


# Build the leveling ladder (IC + manager L1-L5)
**Use when:** Scope · seniority markers · value-embodiment per level.
**What it does:** Scaffolds IC + manager tracks (L1-L5 default) inside your context doc  -  each level with scope, seniority markers, and a value-embodiment line tied to your company values.
**Outcome:** Leveling section of context/people-context.md filled in. Used by offers, PIPs, and review cycles.
## Instructions
Run this as a user-facing action. Use the underlying `define-people-context` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Build our leveling ladder. Use the define-people-context skill. Focus on the leveling section: IC + manager tracks, L1-L5 by default (ask once if I want higher). For each level: name, one-paragraph expectations, scope of impact, seniority markers, and a value-embodiment line. Update context/people-context.md in place.
```
