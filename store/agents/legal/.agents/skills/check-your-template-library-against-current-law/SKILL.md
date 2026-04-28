---
name: check-your-template-library-against-current-law
description: "Flags templates > 12 months old, checks each against current-law changes (AI-training disclosure, SCC versions, 2026 DPA standards, CCPA cure-period, EU AI Act). Never auto-rewrites - recommends chaining to draft-document."
version: 1
tags: ["legal", "overview-action", "audit-compliance"]
category: "Compliance"
featured: yes
integrations: ["googledocs", "googledrive", "stripe", "firecrawl"]
image: "scroll"
---


# Check your template library against current law
**Use when:** Flags stale templates  -  AI, SCCs, 2026 DPA standards.
**What it does:** Flags templates > 12 months old, checks each against current-law changes (AI-training disclosure, SCC versions, 2026 DPA standards, CCPA cure-period, EU AI Act). Never auto-rewrites  -  recommends chaining to draft-document.
**Outcome:** Refresh plan at template-reviews/{date}.md ranked by exposure.
## Instructions
Run this as a user-facing action. Use the underlying `audit-compliance` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Audit my template library. Use the audit-compliance skill with scope=template-library. Read domains.contracts.templateLibrary, flag templates > 12 months old, check each against current-law changes (AI-training disclosure, SCC versions, 2026 DPA standards, CCPA cure-period, EU AI Act). Save a refresh plan to template-reviews/{YYYY-MM-DD}.md.
```
