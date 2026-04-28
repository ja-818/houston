---
name: process-a-pile-of-bank-credit-card-statements
description: "The full pipeline. PDFs → parallel extractors (Haiku) → categorizers (Sonnet) → Google Sheets workbook with a formula-driven P&L. Low-confidence items go to Suspense, never invented GL codes."
version: 1
tags: ["bookkeeping", "overview-action", "process-statements"]
category: "Transactions"
featured: yes
integrations: ["googlesheets", "stripe"]
image: "ledger"
---


# Process a pile of bank / credit-card statements
**Use when:** PDFs → categorized transactions → live Google Sheets P&L.
**What it does:** The full pipeline. PDFs → parallel extractors (Haiku) → categorizers (Sonnet) → Google Sheets workbook with a formula-driven P&L. Low-confidence items go to Suspense, never invented GL codes.
**Outcome:** Live Google Sheet URL + run.json at runs/{period}/ + suspense flagged prominently.
## Instructions
Run this as a user-facing action. Use the underlying `process-statements` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Process these statements. Use the process-statements skill. Extract every transaction from the attached PDFs (parallel Haiku extractors, one per PDF), canonicalize parties, categorize against the locked chart-of-accounts (Sonnet categorizers, one per account), then assemble a Google Sheets workbook with a formula-driven P&L (Sonnet sheets writer). Save the run artifact to runs/{period}/run.json and log to outputs.json. Credit card sign convention: purchases are negative. P&L totals are =SUMIFS formulas, never hardcoded.
```

Preferred tool or integration hint: Google Sheets.
