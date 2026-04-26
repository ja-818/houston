---
name: update-the-rubric-for-an-open-req
description: "Seeds or updates the role rubric at reqs/{slug}.md - level target, must-haves, nice-to-haves, red flags. All other hiring skills read this file first."
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
prompt_template: |
  Update the rubric for the {{role}} req. Use the source-candidates skill (it seeds reqs/{{role_slug}}.md as part of its first step). Ask me: target level, top 3 must-haves, top 3 nice-to-haves, 2-3 red flags. Write to reqs/{{role_slug}}.md. Every hiring skill reads this file next.
---


# Update the rubric for an open req
**Use when:** Level target + must-haves + nice-to-haves.
**What it does:** Seeds or updates the role rubric at reqs/{slug}.md  -  level target, must-haves, nice-to-haves, red flags. All other hiring skills read this file first.
**Outcome:** Rubric at reqs/{role}.md. Source, screen, score, interview, and offer all pull from it.
## Instructions
Run this as a user-facing action. Use the underlying `source-candidates` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Update the rubric for the {role} req. Use the source-candidates skill (it seeds reqs/{role-slug}.md as part of its first step). Ask me: target level, top 3 must-haves, top 3 nice-to-haves, 2-3 red flags. Write to reqs/{role-slug}.md. Every hiring skill reads this file next.
```
