---
name: audit-the-architecture-of-system-for-scale-maintainability
description: "I walk a system / module / service end-to-end and produce a risk-sorted list (high/medium/low) with current state, proposed fix, effort (S/M/L/XL) per item. Favors incremental fixes over rewrites."
version: 1
tags: ["engineering", "overview-action", "audit"]
category: "Development"
featured: yes
integrations: ["github", "gitlab", "firecrawl"]
image: "laptop"
---


# Audit the architecture of {system} for scale / maintainability
**Use when:** Risk-sorted concerns with current state + fix + effort.
**What it does:** I walk a system / module / service end-to-end and produce a risk-sorted list (high/medium/low) with current state, proposed fix, effort (S/M/L/XL) per item. Favors incremental fixes over rewrites.
**Outcome:** An audit at audits/architecture-{system}-{date}.md  -  a ranked backlog of fixes, not a rewrite proposal.
## Instructions
Run this as a user-facing action. Use the underlying `audit` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Audit the architecture of {system}. Use the audit skill with surface=architecture. Read context/engineering-context.md for stack, invariants, and priorities. Walk modules / services / boundaries and produce a risk-sorted list (high / medium / low). For each concern: current state, proposed fix, effort (S/M/L/XL). Flag anything overlapping sensitiveAreas as high by default. Save to audits/architecture-{system-slug}-{YYYY-MM-DD}.md. Favor incremental fixes over rewrites.
```
