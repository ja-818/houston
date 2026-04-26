---
name: set-the-opening-trial-balance
description: "Interview or parse a file to set starting balances on day one. Validated: debits=credits, every code in the CoA."
version: 1
tags: ["bookkeeping", "overview-action", "define-bookkeeping-context"]
category: "Setup"
featured: yes
integrations: ["stripe"]
image: "ledger"
inputs:
  - name: request
    label: "Additional context"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Set the opening trial balance. Use the define-bookkeeping-context skill with mode=opening-balances. Interview me for each GL account's balance as of the opening date, or parse a provided trial-balance file (CSV / xlsx / pasted). Validate: debits total = credits total within 1 cent; every GL code exists in config/chart-of-accounts.json. Write to config/opening-trial-balance.json. Update context-ledger.universal.openingBalances with as-of date and source.

  Additional context: {{request}}
---


# Set the opening trial balance
**Use when:** Starting point on day one  -  must balance, debits = credits.
**What it does:** Interview or parse a file to set starting balances on day one. Validated: debits=credits, every code in the CoA.
**Outcome:** Opening trial balance at config/opening-trial-balance.json + ledger field set.
## Instructions
Run this as a user-facing action. Use the underlying `define-bookkeeping-context` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Set the opening trial balance. Use the define-bookkeeping-context skill with mode=opening-balances. Interview me for each GL account's balance as of the opening date, or parse a provided trial-balance file (CSV / xlsx / pasted). Validate: debits total = credits total within 1 cent; every GL code exists in config/chart-of-accounts.json. Write to config/opening-trial-balance.json. Update context-ledger.universal.openingBalances with as-of date and source.
```
