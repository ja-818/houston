---
name: classify-r-and-d-spend-for-the-credit-section-174
description: "Section 174 / R&D credit support: wages + supplies + cloud + contracted research at 65%, bucketed by project. Exclusions called out. Supporting package for your tax preparer."
version: 1
tags: ["bookkeeping", "overview-action", "classify-rd-expenses"]
category: "Compliance"
featured: yes
integrations: ["gmail", "googledocs", "googledrive", "googlesheets", "hubspot", "linear", "notion", "outlook", "quickbooks", "slack", "stripe", "xero"]
image: "ledger"
---


# Classify R&D spend for the credit / Section 174
**Use when:** Qualified R&D buckets by project / vendor / employee.
**What it does:** Section 174 / R&D credit support: wages + supplies + cloud + contracted research at 65%, bucketed by project. Exclusions called out. Supporting package for your tax preparer.
**Outcome:** Classification at compliance/rd-credit/{year}.md.
## Instructions
Run this as a user-facing action. Use the underlying `classify-rd-expenses` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Classify R&D spend for the specified year. Use the classify-rd-expenses skill. Review vendor invoices + payroll + contractor spend from transactions + journal-entries.json. Bucket into qualified R&D categories (wages for qualified services, supplies, computer leasing / cloud, contract research at 65%) by project if a project list is available. Exclude non-qualifying items (routine data collection, post-commercial-release improvements, funded research). Save to compliance/rd-credit/{year}.md with a summary total and per-project breakdown. Never files  -  supports the credit claim, you or your tax preparer files.
```
