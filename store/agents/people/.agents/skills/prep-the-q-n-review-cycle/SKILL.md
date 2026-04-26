---
name: prep-the-q-n-review-cycle
description: "Produces the self-review template, manager-review template, calibration doc, and full timeline - all scoped to your leveling framework. Draft until you approve the structure."
version: 1
tags: ["people", "overview-action", "prep-review-cycle"]
category: "Performance"
featured: yes
integrations: ["googledocs", "notion"]
image: "busts-in-silhouette"
inputs:
  - name: n
    label: "N"
    required: false
  - name: cycle_slug
    label: "Cycle Slug"
    required: false
prompt_template: |
  Prep the Q{{n}} review cycle. Use the prep-review-cycle skill. Read the leveling framework and review-cycle rhythm from context/people-context.md. Produce the self-review template, the manager-review template, the calibration doc, and the full timeline  -  all scoped to the leveling framework. Write to review-cycles/{{cycle_slug}}.md as status draft until I approve the structure.
---


# Prep the Q{N} review cycle
**Use when:** Self-review + manager + calibration + timeline.
**What it does:** Produces the self-review template, manager-review template, calibration doc, and full timeline  -  all scoped to your leveling framework. Draft until you approve the structure.
**Outcome:** Full cycle package at review-cycles/{slug}.md. Approve structure before I send to managers.
## Instructions
Run this as a user-facing action. Use the underlying `prep-review-cycle` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Prep the Q{N} review cycle. Use the prep-review-cycle skill. Read the leveling framework and review-cycle rhythm from context/people-context.md. Produce the self-review template, the manager-review template, the calibration doc, and the full timeline  -  all scoped to the leveling framework. Write to review-cycles/{cycle-slug}.md as status draft until I approve the structure.
```
