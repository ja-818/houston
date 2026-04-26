---
name: prep-your-delaware-annual-report-franchise-tax
description: "Recalculates Delaware franchise tax under both methods (Authorized-Shares vs Assumed-Par-Value-Capital, often 10-100x cheaper for early-stage), collects directors / officers / issued shares, produces the submission package. Prep only - you file."
version: 1
tags: ["legal", "overview-action", "file-delaware-report"]
category: "Entity"
featured: yes
integrations: ["googledocs"]
image: "scroll"
inputs:
  - name: year
    label: "Year"
    placeholder: "e.g. 2026"
prompt_template: |
  Prep my Delaware annual report. Use the file-delaware-report skill. Recalculate franchise tax under both the Authorized-Shares method AND the Assumed-Par-Value-Capital method (almost always cheaper for early-stage) using issued shares + authorized shares + gross assets from my ledger. Produce the submission package to annual-filings/{{year}}-delaware.md.
---


# Prep your Delaware annual report (franchise tax)
**Use when:** Recalcs both methods  -  often 10-100x cheaper.
**What it does:** Recalculates Delaware franchise tax under both methods (Authorized-Shares vs Assumed-Par-Value-Capital, often 10-100x cheaper for early-stage), collects directors / officers / issued shares, produces the submission package. Prep only  -  you file.
**Outcome:** Package at annual-filings/{YYYY}-delaware.md with both methods shown.
## Instructions
Run this as a user-facing action. Use the underlying `file-delaware-report` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Prep my Delaware annual report. Use the file-delaware-report skill. Recalculate franchise tax under both the Authorized-Shares method AND the Assumed-Par-Value-Capital method (almost always cheaper for early-stage) using issued shares + authorized shares + gross assets from my ledger. Produce the submission package to annual-filings/{YYYY}-delaware.md.
```
