---
name: reconcile-account
description: "Use when the user says 'reconcile January's Chase checking' / 'why is the GL ${X} off the bank statement' / 'reconcile the Stripe subledger for Q1'  -  I reconcile GL vs. bank / CC / Stripe / subledger for a specified account + period, identify timing differences (outstanding checks, deposits in transit) and unmatched items both directions, age everything, and write `reconciliations/{account_last4}/{YYYY-MM}.md` + upsert `recon-breaks.json`. Sub-mode `mode=transfer-detect` finds debit/credit pairs across accounts (same amount, dates within ±2 days) and tags them GL 9000 Internal Transfer. I never silently plug a difference."
version: 1
tags: [bookkeeping, reconcile, account]
category: Bookkeeping
featured: yes
image: ledger
integrations: [stripe, quickbooks, xero]
---


# Reconcile Account

Three-way recon on single account (bank / credit card / payment processor / subledger) for given period. GL balance one side, external statement / feed balance other side, unmatched items aged middle. Invariant: plug never silent. Every diff either explained by timing item, surfaced as unmatched, or escalated as confirmed break.

Draft-only: never adjust GL, never "force match" in QBO / Xero. Write markdown + recon-breaks index.

## When to use

- "reconcile January's Chase checking" / "reconcile Amex 9041 for
  March" / "reconcile Stripe for Q1".
- "why is the GL off the bank by $X" / "what's in the outstanding
  check list".
- Called by `run-monthly-close` for every account in
  `context-ledger.domains.banks.accounts[]` for close period.
- `mode=transfer-detect`  -  "find the transfers across accounts for
  March" / "tag the internal transfer pairs so they fall out of
  P&L". Runs across all accounts at once, not single account.

## Steps

1. **Parse inputs.** Required: `account_last4` (or `all` for
   `mode=transfer-detect`) and `period` (`YYYY-MM` or `YYYY-QN`).
   Resolve `{periodStart, periodEnd}` from period slug.

2. **Read context.** Load `context/bookkeeping-context.md` (stop if
   missing  -  ask user to run `define-bookkeeping-context`
   first), `config/context-ledger.json`, and
   `config/chart-of-accounts.json`.

3. **Identify account.** Look up `account_last4` in
   `context-ledger.domains.banks.accounts[]`. Capture `{bank, type,
   glCode, glName}`. If account not registered, ask ONE
   targeted question to register  -  never guess.

4. **`mode=transfer-detect` branch.** If triggered:
   - Pull all txns across all registered accounts for period.
     Source order: connected app (QBO / Xero / bank feed
     via Composio  -  discover slug with `composio search accounting`
     / `composio search banking`) > `runs/{period}/run.json` if
     present > CSV drop.
   - Pair detection: for each debit in account A on date D, search
     all other accounts for credit with same absolute amount
     on date `D ± 2 days`. Amount tolerance: 1 cent.
   - Tag both legs `glCode = "9000"`, `glName = "Internal
     Transfer"`, `source = "transfer"`. Excluded from
     P&L SUMIFS downstream.
   - Write pair list to
     `reconciliations/_transfers/{period}.md` with each pair's
     `{date_a, account_a, date_b, account_b, amount, confidence}`.
   - Append one-line note to every affected account's recon doc
     if already exist.
   - Skip to Step 10.

5. **Pull two sides.**
   - **GL side**  -  preferred via connected app: `composio search
     accounting`, pick QBO / Xero slug, pull GL register
     for `{glCode, periodStart, periodEnd}`. Discover schema with
     `--get-schema`; never hardcode. Fall back to CSV / paste
     if unconnected.
   - **External side**  -  bank / CC / Stripe:
     - Bank / CC: `composio search banking` (Plaid-backed) or
       `statements/{account_last4}/{YYYY-MM}.pdf` if already
       dropped during `process-statements` run.
     - Stripe: `composio search billing`, pull balance transactions
       for period.
     - Subledger: accept CSV with `{date, description, amount}`
       plus opening + closing balances.

6. **Match items.** Exact match on `(date, amount)` first; then
   `(amount, date ± 2 days)` tolerance. Description similarity
   (token-set ratio ≥ 0.75) breaks ties when multiple candidates
   tie on amount. Confidence thresholds:
   - `≥ 0.95`  -  auto-match (exact).
   - `0.80–0.94`  -  tentative match, surface in review bucket.
   - `< 0.80`  -  unmatched.

7. **Classify unmatched items.**
   - **In GL, not on statement**  -  candidates for outstanding
     checks (if account checking and amount negative),
     deposits in transit (positive), or erroneous GL entry. Age
     each: `daysOld = runDate - transactionDate`.
   - **On statement, not in GL**  -  candidates for unrecorded
     fees / interest / subscription charges. Usually become
     JE suggestion for `prep-journal-entry type=adjustment`.
   - **Amount differences**  -  same party + same date, different
     amount. Flag each with delta.

8. **Compute three-way proof.**
   ```
   gl_ending_balance
     + (on statement, not in GL)
     - (in GL, not on statement)
     ± amount_differences
     = statement_ending_balance    (within 1 cent)
   ```
   If proof doesn't land within 1 cent, **do NOT plug**. Flag
   named break in report and upsert to `recon-breaks.json` with
   `status: "unresolved"`.

9. **Age unmatched items.** Bucket each into `0-30d`, `31-60d`,
   `61-90d`, `>90d`. Items `> 90d` old escalate  -  flag in
   report header.

10. **Write reconciliation doc** to
    `reconciliations/{account_last4}/{YYYY-MM}.md`. Structure:
    - Header: account (bank / type / last4), period, GL balance,
      statement balance, computed difference, status
      (`clean` / `has-items` / `unresolved-break`).
    - **Three-way proof**  -  equation above rendered with real
      numbers.
    - **Outstanding items**  -  table grouped by direction (GL-side
      vs. statement-side), with `{date, description, amount,
      daysOld, ageBucket}`.
    - **Amount differences**  -  table with `{date, party, glAmount,
      statementAmount, delta}`.
    - **Tentative matches**  -  table for human review
      (confidence 0.80–0.94).
    - **Suggested adjustments**  -  list of candidate JEs for
      `prep-journal-entry type=adjustment` (unrecorded fees,
      interest, forex rounding).
    - **Named breaks**  -  only if three-way proof failed. One
      line per break with dollar amount and best-guess cause.

11. **Update indexes.**
    - `recon-breaks.json` (flat at agent root)  -  read-merge-write.
      For each unresolved item upsert
      `{id, accountLast4, period, date, description, amount,
      direction, daysOld, status, addedAt, updatedAt}`. Age-update
      existing entries rather than duplicate.
    - `outputs.json`  -  append
      `{type: "reconciliation", title: "Recon {bank} {last4}
      {YYYY-MM}", summary, path, status: "draft", domain: "close"}`.

12. **Summarize to user.** Two-line recap: three-way proof
    result, and count + dollar total of unmatched items by age
    bucket. Include path to full doc.

## Outputs

- `reconciliations/{account_last4}/{YYYY-MM}.md`  -  full recon.
- `reconciliations/_transfers/{period}.md`  -  only in
  `mode=transfer-detect`.
- `recon-breaks.json`  -  read-merge-write, unresolved items aged.
- `outputs.json`  -  one row appended, `type: "reconciliation"`.