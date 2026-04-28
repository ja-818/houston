---
name: prep-the-investor-board-financials-package
description: "Board-ready package: statements + startup KPIs (ARR, gross margin, burn, runway, retention) with a one-page exec summary."
version: 1
tags: ["bookkeeping", "overview-action", "prep-investor-financials"]
category: "Reporting"
featured: yes
integrations: ["googledocs"]
image: "ledger"
---


# Prep the investor / board financials package
**Use when:** Statements + ARR + gross margin + burn + runway + retention.
**What it does:** Board-ready package: statements + startup KPIs (ARR, gross margin, burn, runway, retention) with a one-page exec summary.
**Outcome:** Package at investor-financials/{yyyy-qq}.md (+ Google Doc mirror if connected).
## Instructions
Run this as a user-facing action. Use the underlying `prep-investor-financials` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Prep the investor financials package. Use the prep-investor-financials skill. Assemble from the latest close: P&L + balance sheet + cash flow + ARR / MRR (if SaaS), gross margin, net burn, runway months, and cohort retention if contract data is available. Format for board / investor consumption with a one-page summary at the top. Save to investor-financials/{yyyy-qq}.md with an optional Google Docs mirror if connected.
```

Preferred tool or integration hint: Google Docs.
