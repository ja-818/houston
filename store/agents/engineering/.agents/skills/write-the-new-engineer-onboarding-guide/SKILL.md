---
name: write-the-new-engineer-onboarding-guide
description: "I maintain a single running onboarding-guide.md at the agent root with First day / First week / First month, verified setup steps, conventions, sensitive areas, FAQ. Read-merge-update, never wholesale-overwrite."
version: 1
tags: ["engineering", "overview-action", "write-docs"]
category: "Docs"
featured: yes
integrations: ["stripe", "notion", "github", "gitlab", "perplexityai"]
image: "laptop"
inputs:
  - name: request
    label: "Additional context"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Write (or update) the new-engineer onboarding guide. Use the write-docs skill with type=onboarding-guide. Read context/engineering-context.md + the repo structure (README, CONTRIBUTING, Makefile, package.json scripts, docker-compose, .env.example, CI config) via my connected GitHub / GitLab. Maintain a single running onboarding-guide.md at the agent root: First day (clone, setup, first successful local run), First week (repo map, conventions, how PRs work here, sensitive areas), First month (owned systems, FAQ). Verify every setup step against the actual Makefile / scripts. Draft only  -  I never auto-commit.

  Additional context: {{request}}
---


# Write the new-engineer onboarding guide
**Use when:** First day / First week / First month. Verified steps.
**What it does:** I maintain a single running onboarding-guide.md at the agent root with First day / First week / First month, verified setup steps, conventions, sensitive areas, FAQ. Read-merge-update, never wholesale-overwrite.
**Outcome:** A living onboarding-guide.md at the agent root. Send to the next hire's day one.
## Instructions
Run this as a user-facing action. Use the underlying `write-docs` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Write (or update) the new-engineer onboarding guide. Use the write-docs skill with type=onboarding-guide. Read context/engineering-context.md + the repo structure (README, CONTRIBUTING, Makefile, package.json scripts, docker-compose, .env.example, CI config) via my connected GitHub / GitLab. Maintain a single running onboarding-guide.md at the agent root: First day (clone, setup, first successful local run), First week (repo map, conventions, how PRs work here, sensitive areas), First month (owned systems, FAQ). Verify every setup step against the actual Makefile / scripts. Draft only  -  I never auto-commit.
```
