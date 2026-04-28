---
name: build-the-asc-606-revenue-recognition-schedule
description: "ASC 606 schedule per contract with performance-obligation identification, price allocation, and month-by-month recognition. Handles startup SaaS patterns (annual upfront, usage, implementation fees)."
version: 1
tags: ["bookkeeping", "overview-action", "calculate-revenue-recognition"]
category: "Close"
featured: yes
integrations: ["hubspot", "stripe"]
image: "ledger"
---


# Build the ASC 606 revenue-recognition schedule
**Use when:** Per-contract: performance obligation → transaction price → monthly rec.
**What it does:** ASC 606 schedule per contract with performance-obligation identification, price allocation, and month-by-month recognition. Handles startup SaaS patterns (annual upfront, usage, implementation fees).
**Outcome:** Schedule at revrec/{customer}/{contract}.json.
## Instructions
Run this as a user-facing action. Use the underlying `calculate-revenue-recognition` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Build the revenue recognition schedule. Use the calculate-revenue-recognition skill. For the specified contract, identify performance obligations, allocate the transaction price across obligations (standalone selling price allocation for bundles), and produce the monthly recognition schedule. Handle common startup patterns: annual upfront / monthly ratable, usage-based with a floor, implementation-fee deferral, contract modifications. Save to revrec/{customer-slug}/{contract-slug}.json.
```
