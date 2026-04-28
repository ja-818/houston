---
name: audit-my-readme-what-s-missing
description: "I fetch your repo's README, score against a standard checklist, write inline diff suggestions + a rewritten lede, and produce a prioritized fix list. Never auto-commits."
version: 1
tags: ["engineering", "overview-action", "audit"]
category: "Docs"
featured: yes
integrations: ["github", "gitlab", "firecrawl"]
image: "laptop"
---


# Audit my README  -  what's missing?
**Use when:** Checklist score + rewritten lede + prioritized fixes.
**What it does:** I fetch your repo's README, score against a standard checklist, write inline diff suggestions + a rewritten lede, and produce a prioritized fix list. Never auto-commits.
**Outcome:** An audit at audits/readme-{repo}-{date}.md with a rewritten lede and inline diffs.
## Instructions
Run this as a user-facing action. Use the underlying `audit` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Audit my repo's README. Use the audit skill with surface=readme. Fetch README from my connected GitHub / GitLab (or accept a paste). Score against: one-sentence pitch, badges, quickstart, install, usage, configuration, contribution, license. Write an audit with inline diff suggestions, a rewritten lede, and a prioritized fix list. Save to audits/readme-{repo}-{YYYY-MM-DD}.md. Draft only  -  I never auto-commit.
```
