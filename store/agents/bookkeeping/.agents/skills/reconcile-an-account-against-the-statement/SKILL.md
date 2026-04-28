---
name: reconcile-an-account-against-the-statement
description: "GL vs. statement comparison with timing-difference detection, unmatched-item aging, and adjustment candidates. Never plugs a difference silently."
version: 1
tags: ["bookkeeping", "overview-action", "reconcile-account"]
category: "Transactions"
featured: yes
integrations: ["stripe", "quickbooks", "xero"]
image: "ledger"
---


# Reconcile an account against the statement
**Use when:** GL vs. bank / CC / Stripe. Unmatched-item aging, no silent plugs.
**What it does:** GL vs. statement comparison with timing-difference detection, unmatched-item aging, and adjustment candidates. Never plugs a difference silently.
**Outcome:** Report at reconciliations/{account}/{period}.md + rows in recon-breaks.json.
## Instructions
Run this as a user-facing action. Use the underlying `reconcile-account` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Reconcile the account. Use the reconcile-account skill. Compare GL balance against the bank / credit-card / Stripe statement for the specified account and period. Identify timing differences (outstanding checks, deposits in transit), unmatched transactions both directions, and any amount differences. Age unmatched items. Write the report to reconciliations/{account_last4}/{YYYY-MM}.md and upsert recon-breaks.json. Never silently force a match  -  every difference is surfaced with aging.
```
