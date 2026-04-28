---
name: pull-the-auto-renew-clauses-from-every-contract
description: "I parse each contract, extract the clause verbatim + plain-language summary + flag onerous notice windows. Also updates your renewal calendar."
version: 1
tags: ["operations", "overview-action", "extract-contract-clauses"]
category: "Finance"
featured: yes
integrations: ["googledrive"]
image: "clipboard"
---


# Pull the auto-renew clauses from every contract
**Use when:** Verbatim quotes + plain-language summary + flags.
**What it does:** I parse each contract, extract the clause verbatim + plain-language summary + flag onerous notice windows. Also updates your renewal calendar.
**Outcome:** Per-contract extracts and an updated renewals/calendar.md.
## Instructions
Run this as a user-facing action. Use the underlying `extract-contract-clauses` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Extract the auto-renew language from every contract in {folder}. Use the extract-contract-clauses skill. Parse each contract, extract the clause with a verbatim quote + plain-language summary + flag if the notice window is onerous or the auto-renew is silent. Also update the renewal calendar.
```
