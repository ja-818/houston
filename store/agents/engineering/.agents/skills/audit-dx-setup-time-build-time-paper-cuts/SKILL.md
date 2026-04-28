---
name: audit-dx-setup-time-build-time-paper-cuts
description: "I read your README, CONTRIBUTING, Makefile, package.json scripts, docker-compose, .env.example and CI config. Estimate setup time, build time from CI history, and surface the top 5 paper cuts with suggested fixes."
version: 1
tags: ["engineering", "overview-action", "audit"]
category: "Development"
featured: yes
integrations: ["github", "gitlab", "firecrawl"]
image: "laptop"
---


# Audit DX  -  setup time, build time, paper cuts
**Use when:** Top 5 paper cuts with suggested fixes.
**What it does:** I read your README, CONTRIBUTING, Makefile, package.json scripts, docker-compose, .env.example and CI config. Estimate setup time, build time from CI history, and surface the top 5 paper cuts with suggested fixes.
**Outcome:** An audit at audits/devx-{repo}-{date}.md  -  the 5 things to fix this week to stop annoying new engineers.
## Instructions
Run this as a user-facing action. Use the underlying `audit` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Audit our local dev experience. Use the audit skill with surface=devx. Read README + CONTRIBUTING + Makefile + package.json scripts + docker-compose + .env.example + CI config via the connected code host. Count discrete setup steps, estimate setup time, estimate build time from CI history, and surface the top 5 paper cuts (missing env vars, flaky scripts, bad error messages, outdated commands) with suggested fixes + effort. Save to audits/devx-{repo}-{YYYY-MM-DD}.md.
```
