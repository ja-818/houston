---
name: draft-the-q-n-roadmap-top-3-priorities-sized
description: "I read the engineering context + every artifact in this agent's outputs.json, then write the quarterly roadmap with top 3 priorities, sizing, rationale, and dependencies."
version: 1
tags: ["engineering", "overview-action", "plan-roadmap"]
category: "Planning"
featured: yes
integrations: ["github", "linear", "jira"]
image: "laptop"
inputs:
  - name: n
    label: "N"
    required: false
  - name: year
    label: "Year"
    placeholder: "e.g. 2026"
prompt_template: |
  Draft the Q{{n}} engineering roadmap. Use the plan-roadmap skill. Read context/engineering-context.md for current priorities and cross-check outputs.json for in-flight work you shouldn't re-plan. Pick the top 3 priorities for the quarter, size each S/M/L, state rationale, list dependencies. Markdown, not a Gantt. Save to roadmaps/q{{n}}-{{year}}.md. Close with one paragraph on what I should say no to this quarter to protect the top 3.
---


# Draft the Q{n} roadmap  -  top 3 priorities, sized
**Use when:** Top 3 priorities, S/M/L, rationale, dependencies.
**What it does:** I read the engineering context + every artifact in this agent's outputs.json, then write the quarterly roadmap with top 3 priorities, sizing, rationale, and dependencies.
**Outcome:** A roadmap at roadmaps/q{n}-{year}.md I can paste to the team or share with investors.
## Instructions
Run this as a user-facing action. Use the underlying `plan-roadmap` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft the Q{n} engineering roadmap. Use the plan-roadmap skill. Read context/engineering-context.md for current priorities and cross-check outputs.json for in-flight work you shouldn't re-plan. Pick the top 3 priorities for the quarter, size each S/M/L, state rationale, list dependencies. Markdown, not a Gantt. Save to roadmaps/q{n}-{year}.md. Close with one paragraph on what I should say no to this quarter to protect the top 3.
```
