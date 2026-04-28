---
name: audit-your-privacy-posture-for-drift
description: "Scrapes your landing + product via Firecrawl, cross-checks your deployed Privacy Policy, and flags drift (new analytics undisclosed, subprocessor missed, new cookie, purpose drift) with severity tags and authority citations (GDPR Art. 13/14, CCPA…"
version: 1
tags: ["legal", "overview-action", "audit-compliance"]
category: "Compliance"
featured: yes
integrations: ["googledocs", "googledrive", "stripe", "firecrawl"]
image: "scroll"
---


# Audit your privacy posture for drift
**Use when:** Scrape landing + product, diff vs deployed policy.
**What it does:** Scrapes your landing + product via Firecrawl, cross-checks your deployed Privacy Policy, and flags drift (new analytics undisclosed, subprocessor missed, new cookie, purpose drift) with severity tags and authority citations (GDPR Art. 13/14, CCPA §1798.100).
**Outcome:** Audit at privacy-audits/{date}.md with critical findings at the top.
## Instructions
Run this as a user-facing action. Use the underlying `audit-compliance` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Audit my privacy posture. Use the audit-compliance skill with scope=privacy-posture. Scrape my landing page + product via Firecrawl, fetch my deployed Privacy Policy, and diff (new analytics tool undisclosed, subprocessor added without policy update, new cookie, purpose drift). Tag each finding by severity with authority citations. Save to privacy-audits/{YYYY-MM-DD}.md.
```
