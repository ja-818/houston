---
name: audit-ci-cd-flakies-slow-jobs-missing-gates
description: "I read workflow config + recent run history via GitHub or GitLab. Flakies ranked by rate × frequency, slowest jobs by minutes-per-week, missing gates vs your quality bar, security gaps. Prioritized fix list, not a warnings dump."
version: 1
tags: ["engineering", "overview-action", "audit"]
category: "Development"
featured: yes
integrations: ["github", "gitlab", "firecrawl"]
image: "laptop"
inputs:
  - name: repo
    label: "Repo"
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Audit my CI/CD. Use the audit skill with surface=ci-cd. Pull workflow config + last 100 runs from my connected GitHub / GitLab. Identify flaky tests (same-SHA retry-pass), rank slowest jobs by minutes-per-week, enumerate missing gates vs the quality bar in context/engineering-context.md, flag security gaps (plaintext secrets, unpinned actions, pull_request_target leaks). Save to audits/ci-cd-{{repo}}-{{date}}.md with a prioritized fix list ranked by founder-impact.
---


# Audit CI/CD  -  flakies, slow jobs, missing gates
**Use when:** Impact × effort fix list, not a warnings dump.
**What it does:** I read workflow config + recent run history via GitHub or GitLab. Flakies ranked by rate × frequency, slowest jobs by minutes-per-week, missing gates vs your quality bar, security gaps. Prioritized fix list, not a warnings dump.
**Outcome:** An audit at audits/ci-cd-{repo}-{date}.md with a ranked fix list.
## Instructions
Run this as a user-facing action. Use the underlying `audit` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Audit my CI/CD. Use the audit skill with surface=ci-cd. Pull workflow config + last 100 runs from my connected GitHub / GitLab. Identify flaky tests (same-SHA retry-pass), rank slowest jobs by minutes-per-week, enumerate missing gates vs the quality bar in context/engineering-context.md, flag security gaps (plaintext secrets, unpinned actions, pull_request_target leaks). Save to audits/ci-cd-{repo}-{YYYY-MM-DD}.md with a prioritized fix list ranked by founder-impact.
```
