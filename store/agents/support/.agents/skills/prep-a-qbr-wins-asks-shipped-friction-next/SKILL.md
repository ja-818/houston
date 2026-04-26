---
name: prep-a-qbr-wins-asks-shipped-friction-next
description: "4-section outline - wins (achieved), asks-shipped (their requests shipped), friction (open pains), next moves (renewal / expansion). Grounded in the timeline + request IDs."
version: 1
tags: ["support", "overview-action", "review"]
category: "Success"
featured: yes
integrations: ["googledocs", "notion", "slack"]
image: "headphone"
inputs:
  - name: account
    label: "Account"
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Prep the QBR for {{account}}. Use the review skill with scope=qbr. Chain customer-view view=timeline for the account. Read requests.json + bug-candidates.json + followups.json filtered to this account. Structure: wins (achieved) / asks-shipped (their requests shipped) / friction (open pains) / next moves (renewal / expansion / investment). Save to qbrs/{{account}}-{{date}}.md.
---


# Prep a QBR  -  wins / asks-shipped / friction / next
**Use when:** 4-section outline grounded in the timeline.
**What it does:** 4-section outline  -  wins (achieved), asks-shipped (their requests shipped), friction (open pains), next moves (renewal / expansion). Grounded in the timeline + request IDs.
**Outcome:** QBR at `qbrs/{account}-{date}.md`  -  walk in ready.
## Instructions
Run this as a user-facing action. Use the underlying `review` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Prep the QBR for {account}. Use the review skill with scope=qbr. Chain customer-view view=timeline for the account. Read requests.json + bug-candidates.json + followups.json filtered to this account. Structure: wins (achieved) / asks-shipped (their requests shipped) / friction (open pains) / next moves (renewal / expansion / investment). Save to qbrs/{account}-{YYYY-MM-DD}.md.
```
