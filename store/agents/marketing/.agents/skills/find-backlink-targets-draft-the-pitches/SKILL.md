---
name: find-backlink-targets-draft-the-pitches
description: "I identify target sites via SERP + Ahrefs (backlink tool) that match your niche, then draft per-target pitch emails grounded in what you actually offer them."
version: 1
tags: ["marketing", "overview-action", "find-backlinks"]
category: "SEO"
featured: yes
integrations: ["firecrawl", "semrush", "ahrefs"]
image: "megaphone"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Find backlink targets and draft the pitches. Use the find-backlinks skill. Identify target sites via SERP + my connected Ahrefs (backlink tool) that match our niche, then draft per-target pitch emails grounded in what we actually offer them. Save to backlink-plans/{{date}}.md.
---


# Find backlink targets + draft the pitches
**Use when:** Per-site pitch emails  -  no template spam.
**What it does:** I identify target sites via SERP + Ahrefs (backlink tool) that match your niche, then draft per-target pitch emails grounded in what you actually offer them.
**Outcome:** Backlink plan at backlink-plans/{date}.md with outreach drafts per target.
## Instructions
Run this as a user-facing action. Use the underlying `find-backlinks` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Find backlink targets and draft the pitches. Use the find-backlinks skill. Identify target sites via SERP + my connected Ahrefs (backlink tool) that match our niche, then draft per-target pitch emails grounded in what we actually offer them. Save to backlink-plans/{YYYY-MM-DD}.md.
```
