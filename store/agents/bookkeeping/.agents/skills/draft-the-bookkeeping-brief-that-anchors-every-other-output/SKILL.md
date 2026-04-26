---
name: draft-the-bookkeeping-brief-that-anchors-every-other-output
description: "I interview you briefly and write the full bookkeeping brief (entity, accounting method, accounts, revenue model, payroll, tax posture) to context/bookkeeping-context.md. Every other skill reads it first."
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
  Help me set up my bookkeeping context. Use the define-bookkeeping-context skill. Interview me briefly on entity (legal name, type, state, EIN, fiscal year), accounting method (cash vs. accrual), accounts (bank, credit card, Stripe), payroll provider, revenue model, and tax preparer. Write the full doc to context/bookkeeping-context.md  -  the source of truth every other skill reads before producing anything substantive.

  Additional context: {{request}}
---


# Draft the bookkeeping brief that anchors every other output
**Use when:** Entity, fiscal year, cash vs. accrual, accounts, opening balances.
**What it does:** I interview you briefly and write the full bookkeeping brief (entity, accounting method, accounts, revenue model, payroll, tax posture) to context/bookkeeping-context.md. Every other skill reads it first.
**Outcome:** A locked brief at context/bookkeeping-context.md. Every skill reads it before producing anything substantive.
## Instructions
Run this as a user-facing action. Use the underlying `define-bookkeeping-context` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Help me set up my bookkeeping context. Use the define-bookkeeping-context skill. Interview me briefly on entity (legal name, type, state, EIN, fiscal year), accounting method (cash vs. accrual), accounts (bank, credit card, Stripe), payroll provider, revenue model, and tax preparer. Write the full doc to context/bookkeeping-context.md  -  the source of truth every other skill reads before producing anything substantive.
```
