---
name: run-a-uspto-knockout-search-on-a-mark
description: "Searches USPTO Trademark Center (Jan 2025 platform) for exact hits, phonetic variants, and visual variants in the relevant Nice classes. Returns Low / Medium / High risk with recommended next step. Honest about knockout-vs-clearance limits."
version: 1
tags: ["legal", "overview-action", "run-trademark-search"]
category: "IP"
featured: yes
integrations: ["firecrawl"]
image: "scroll"
---


# Run a USPTO knockout search on a mark
**Use when:** Exact + phonetic + visual variants, Nice class-aware.
**What it does:** Searches USPTO Trademark Center (Jan 2025 platform) for exact hits, phonetic variants, and visual variants in the relevant Nice classes. Returns Low / Medium / High risk with recommended next step. Honest about knockout-vs-clearance limits.
**Outcome:** Search at tm-searches/{mark}-{date}.md with risk assessment.
## Instructions
Run this as a user-facing action. Use the underlying `run-trademark-search` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Run a USPTO knockout search on {mark}. Use the run-trademark-search skill. Search USPTO Trademark Center for exact hits, phonetic variants, and visual variants in the relevant Nice classes. Return Low / Medium / High risk with recommended next step. Save to tm-searches/{mark-slug}-{YYYY-MM-DD}.md. Honest about knockout-vs-clearance limits.
```
