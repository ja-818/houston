---
name: draft-a-runbook-for-system
description: "I produce a command-first ops doc with bash snippets + placeholders, dashboard URLs, rollback commands, and if-this-fails decision branches. No prose walls."
version: 1
tags: ["engineering", "overview-action", "draft-runbook"]
category: "Reliability"
featured: yes
integrations: ["github", "gitlab"]
image: "laptop"
inputs:
  - name: system
    label: "System"
  - name: slug
    label: "Slug"
    required: false
prompt_template: |
  Draft a runbook for {{system}}. Use the draft-runbook skill. Command-first ops doc with bash snippets + placeholders, dashboard URLs (from my connected Sentry / Datadog), rollback commands, and if-this-fails decision branches. No prose walls  -  every section is a command block or decision branch. Save to runbooks/{{slug}}.md.
---


# Draft a runbook for {system}
**Use when:** Commands, dashboards, rollback, if-this-fails branches.
**What it does:** I produce a command-first ops doc with bash snippets + placeholders, dashboard URLs, rollback commands, and if-this-fails decision branches. No prose walls.
**Outcome:** A runbook at runbooks/{slug}.md  -  pasteable during an incident.
## Instructions
Run this as a user-facing action. Use the underlying `draft-runbook` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft a runbook for {system}. Use the draft-runbook skill. Command-first ops doc with bash snippets + placeholders, dashboard URLs (from my connected Sentry / Datadog), rollback commands, and if-this-fails decision branches. No prose walls  -  every section is a command block or decision branch. Save to runbooks/{slug}.md.
```
