---
name: source-candidates-from-github-linkedin-or-oss
description: "Pulls candidates from GitHub, LinkedIn, community, or OSS via Firecrawl and ranks them against the role rubric. Writes to sourcing-lists/{role-slug}-{date}.md - top matches first."
version: 1
tags: ["people", "overview-action", "source-candidates"]
category: "Hiring"
featured: yes
integrations: ["github", "linkedin", "firecrawl"]
image: "busts-in-silhouette"
inputs:
  - name: role
    label: "Role"
  - name: role_slug
    label: "Role Slug"
    required: false
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Source candidates for the {{role}} role. Use the source-candidates skill. Pull from my signal source (GitHub / LinkedIn / community posts / OSS repos) via Firecrawl, score each against the must-haves in reqs/{{role_slug}}.md, and write a ranked list to sourcing-lists/{{role_slug}}-{{date}}.md.
---


# Source candidates from GitHub, LinkedIn, or OSS
**Use when:** Ranked list against the role rubric, scraped fresh.
**What it does:** Pulls candidates from GitHub, LinkedIn, community, or OSS via Firecrawl and ranks them against the role rubric. Writes to sourcing-lists/{role-slug}-{date}.md  -  top matches first.
**Outcome:** Ranked list at sourcing-lists/{role}-{date}.md  -  move the top names straight into screening.
## Instructions
Run this as a user-facing action. Use the underlying `source-candidates` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Source candidates for the {role} role. Use the source-candidates skill. Pull from my signal source (GitHub / LinkedIn / community posts / OSS repos) via Firecrawl, score each against the must-haves in reqs/{role-slug}.md, and write a ranked list to sourcing-lists/{role-slug}-{YYYY-MM-DD}.md.
```
