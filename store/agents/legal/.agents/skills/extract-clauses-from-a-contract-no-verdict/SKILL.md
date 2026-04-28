---
name: extract-clauses-from-a-contract-no-verdict
description: "Structured clause extraction when you need the map without the verdict. Each clause: quoted counterparty text + plain-English paraphrase + 'what to watch' one-liner. Updates the tracker."
version: 1
tags: ["legal", "overview-action", "review-contract"]
category: "Contracts"
featured: yes
integrations: ["googledocs", "googledrive", "notion", "firecrawl"]
image: "scroll"
---


# Extract clauses from a contract (no verdict)
**Use when:** Structured map: term, liability, IP, DPA, exit rights.
**What it does:** Structured clause extraction when you need the map without the verdict. Each clause: quoted counterparty text + plain-English paraphrase + 'what to watch' one-liner. Updates the tracker.
**Outcome:** Extract at clause-extracts/{counterparty}-{date}.md + row in counterparty-tracker.json.
## Instructions
Run this as a user-facing action. Use the underlying `review-contract` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Extract the clauses from this contract with {counterparty}. Use the review-contract skill with mode=clauses-only. Produce a structured map (term, termination, renewal, liability cap, indemnity, IP, governing law, DPA, AI training, data residency, exit rights)  -  no verdict, just the structure. Save to clause-extracts/{counterparty-slug}-{YYYY-MM-DD}.md and update counterparty-tracker.json.
```
