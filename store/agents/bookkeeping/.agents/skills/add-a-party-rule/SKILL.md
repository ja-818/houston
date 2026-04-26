---
name: add-a-party-rule
description: "Teach me a rule once and I'll apply it forever. Stored in config/party-rules.json, applied before prior-year memory or AI reasoning."
version: 1
tags: ["bookkeeping", "overview-action", "categorize-transactions"]
category: "Transactions"
featured: yes
integrations: ["stripe", "quickbooks", "xero"]
image: "ledger"
inputs:
  - name: canonical_party
    label: "Canonical Party"
  - name: gl_code
    label: "Gl Code"
  - name: gl_name
    label: "Gl Name"
prompt_template: |
  Add a party rule. Use the categorize-transactions skill in RULE-ADD sub-mode. Canonicalize the specified vendor name the same way the categorizer does, then upsert `{canonical_party: gl_code}` into config/party-rules.json. Confirm the GL code exists in the locked chart-of-accounts. Return a short confirmation: 'Added rule: {{canonical_party}} → {{gl_code}} {{gl_name}}. Will auto-categorize on all future runs with source=rule.'
---


# Add a party rule
**Use when:** One-click memory: 'always categorize {vendor} as {GL}'.
**What it does:** Teach me a rule once and I'll apply it forever. Stored in config/party-rules.json, applied before prior-year memory or AI reasoning.
**Outcome:** Upsert to config/party-rules.json. Confirmed GL exists in CoA.
## Instructions
Run this as a user-facing action. Use the underlying `categorize-transactions` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Add a party rule. Use the categorize-transactions skill in RULE-ADD sub-mode. Canonicalize the specified vendor name the same way the categorizer does, then upsert `{canonical_party: gl_code}` into config/party-rules.json. Confirm the GL code exists in the locked chart-of-accounts. Return a short confirmation: 'Added rule: {canonical_party} → {gl_code} {gl_name}. Will auto-categorize on all future runs with source=rule.'
```
