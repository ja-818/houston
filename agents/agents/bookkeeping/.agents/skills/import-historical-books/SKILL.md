---
name: import-historical-books
description: "Use when the user says 'load the prior year's books' / 'import from QuickBooks' / 'backfill from Xero' / 'import this spreadsheet' — I parse a QBO export (General Ledger / Transaction List), a Xero export, or a generic CSV / xlsx, then seed `config/chart-of-accounts.json` (if missing), `config/opening-trial-balance.json` from the closing balances of the prior period, and `config/prior-categorizations.json` with majority-GL-per-vendor rules from transaction history."
---

# Import Historical Books

Backfill memory from prior system — QuickBooks Online, Xero, or generic spreadsheet. Nothing post to QBO/Xero; strictly one-way read landing in `config/` and `run-index.json` so every downstream skill (`process-statements`, `categorize-transactions`, `run-monthly-close`) start with vendor knowledge not cold.

Draft-only, read-only: no connect back to QBO/Xero to push, no rewrite founder prior books. Learn from them.

## When to use

- "load the prior year's books" / "import from QuickBooks" / "backfill from this spreadsheet" / "pull in our Xero history".
- "seed vendor memory from last year's transaction list".
- Called implicitly by `define-bookkeeping-context mode=opening-balances` when founder drops full prior-period export instead of trial-balance-only file.

## Steps

1. **Read config.** Load `config/context-ledger.json` — required: `universal.company.fiscalYearEnd` (determines import period boundary), `universal.accountingMethod` (cash vs. accrual affects opening balance interpretation). If missing, ask ONE targeted question (modality hint: connected app > file > URL > paste) and continue.

2. **Identify source format.** User drops one of:
   - **QBO General Ledger export** — xlsx/csv, columns roughly `{Date, Transaction Type, Num, Name, Memo/Description, Account, Split, Amount, Balance}`.
   - **QBO Transaction List** — xlsx/csv with `{Date, Transaction Type, Num, Posting, Name, Memo/Description, Account, Split, Amount}`.
   - **Xero export** (General Ledger Detail or Account Transactions) — csv with `{Date, Source, Description, Reference, Debit, Credit, Running Balance, Account Code, Account Name}`.
   - **Generic CSV / xlsx** — user must specify column map, or ask: `{date, party|vendor, amount|debit+credit, gl_code, gl_name, memo?}`.

   Detect format by column headers. If ambiguous, confirm inline with one question. For xlsx use `openpyxl`; for CSV use stdlib `csv` module.

3. **Discover Composio connection only if needed.** If user asks pull direct from QBO/Xero instead of file drop, discover slug at runtime:

   ```bash
   /Users/milo/.composio/composio search accounting
   ```

   Never hardcode tool names. If no connection exists, print link command and stop — no invent data. File drop always preferred path; connected-app pull is option, not default.

4. **Parse into normalized row stream.** Every source row lands as:

   ```ts
   {
     date: string;          // YYYY-MM-DD
     party: string;         // raw vendor/customer name from the source
     amount: number;        // signed: money out of the business = negative
     glCode: string;        // text, validated later against CoA
     glName: string;
     memo?: string;
     docType?: string;      // "Bill", "Check", "Invoice", etc.
   }
   ```

   QBO debits/credits: `Amount` column already signed in General Ledger export. In Transaction List, `Amount` reflects account's natural balance — check `Account` column to normalize to agent-wide sign convention (money out of business = negative).

   Xero: compute `amount = debit - credit`, then apply same sign convention per account type (asset/expense debits = positive = money out ⇒ flip to negative; revenue/liability credits = money in ⇒ leave positive).

5. **Seed Chart of Accounts (only if ours missing).** If `config/chart-of-accounts.json` does NOT exist AND export includes CoA (QBO and Xero exports both do — unique set of `{gl_code, gl_name, account_type}` tuples), build initial CoA from export. Normalize:
   - Coerce every `code` to string.
   - Map source's account-type vocabulary to our enum: `Bank / Accounts Receivable / Other Current Asset / Fixed Asset` → `asset`; `Accounts Payable / Credit Card / Other Current Liability / Long Term Liability` → `liability`; `Equity` → `equity`; `Income / Other Income` → `revenue`; `Cost of Goods Sold` → `cogs`; `Expense / Other Expense` → `expense`.
   - Assign `statementSection` per `build-chart-of-accounts` Step 5 validation rules — default opex lines to `operating-expenses.ga` and flag in summary so user can reclassify to `.rd` / `.sm`.
   - Write via `build-chart-of-accounts` schema and validators. **Do NOT overwrite existing CoA** — if exists, leave alone and report any new codes in export as candidates for follow-up revision.

6. **Build opening trial balance.** From prior period's CLOSING balances (last row per GL code in General Ledger export, or `Running Balance` column at period end in Xero):

   - Group by `glCode`; take final balance.
   - Positive balances for `asset` + `expense` + `cogs` types go to `debit`; negative go to `credit`. Positive for `liability` + `equity` + `revenue` types go to `credit`; negative to `debit`.
   - Sum debits and credits across whole TB. If not balanced within 1 cent, surface diff and stop — no plug.
   - Write `config/opening-trial-balance.json` atomically as `[{glCode, debit, credit}]`.
   - Update `config/context-ledger.json → universal.openingBalances` with `{asOf, source: "qbo-import" | "xero-import" | "prior-books", trialBalancePath: "config/opening-trial-balance.json", capturedAt}` (read-merge-write).

7. **Seed prior categorizations.** From transaction history:

   - Canonicalize each `party` using same rules as `process-statements` Stage 4 (strip noise prefixes, trailing reference numbers, city/state suffixes; Title Case).
   - Group transactions by `canonical_party`. For each party, count occurrences per `glCode`.
   - Take majority `glCode` ONLY if accounts for ≥ 80% of party's transactions AND party has ≥ 3 transactions. Otherwise skip (ambiguous parties poison next run — same rule as Step 7 in `process-statements`).
   - Validate winning `glCode` against CoA. Drop any not resolving.
   - Write `config/prior-categorizations.json` atomically as `{canonical_party: gl_code}`. If file exists, read-merge-write — preserve existing entries unless import majority disagrees with confidence ≥ 0.95, in which case log conflict and keep existing entry (agent been learning from real runs; import is historical).

8. **Mark period as imported in `run-index.json`.** Read existing `run-index.json` (create empty array if absent), append:

   ```json
   {
     "id": "{uuid4}",
     "period": "2023",
     "periodStart": "2023-01-01",
     "periodEnd": "2023-12-31",
     "status": "imported",
     "source": "qbo-import" | "xero-import" | "csv-import",
     "accountsIncluded": ["..."],
     "transactionCount": 0,
     "createdAt": "{now}",
     "updatedAt": "{now}"
   }
   ```

   Write atomically (read-merge-write — never overwrite).

9. **DO NOT write detailed transactions.** This skill no produce `runs/{period}/run.json` — imported period not run we own, it's prior system's ledger. If user want reviewed workbook for imported period, drop statements into `statements/_inbox/` and invoke `process-statements`, which benefit from seeded prior-categorizations.

10. **DO NOT append to `outputs.json`.** CoA, opening TB, prior-categorizations all config. `run-index.json` row is single index entry, there.

11. **Summarize to user.** Counts: transactions parsed, unique parties canonicalized, prior-categorizations seeded (with ≥ 80% / ≥ 3-txn threshold explained), CoA rows adopted (or skipped because ours exists), opening TB balance-check result. Flag ambiguous parties that missed threshold — founder can promote manually via `config/party-rules.json`. Next move: "process this year's statements and categorization will hit most rows from prior memory".

## Outputs

- `config/chart-of-accounts.json` — only if we didn't have one.
- `config/opening-trial-balance.json` — prior period closing TB, now opening TB of our books.
- `config/prior-categorizations.json` — seeded vendor memory (read-merge-write).
- `config/context-ledger.json` — `universal.openingBalances` refreshed (read-merge-write).
- `run-index.json` — one new row with `status: "imported"` (read-merge-write).

No entry in `outputs.json`.