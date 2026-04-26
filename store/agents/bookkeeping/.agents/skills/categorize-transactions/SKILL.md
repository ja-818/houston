---
name: categorize-transactions
description: "Use when the user says 'categorize these pending transactions' / 'review QBO's pending queue' / 'clean up the uncategorized tray'  -  I pull a pending-transaction list from QBO / Xero / CSV, canonicalize each party, apply rules → prior-year memory → calibrated reasoning against the locked chart-of-accounts, and write a review-ready batch to `transactions/{YYYY-MM-DD}.md`. Sub-mode `mode=rule-add` upserts `{canonical_party: gl_code}` into `config/party-rules.json` after verifying the GL exists in the CoA. Draft-only: I never post to QBO / Xero."
version: 1
tags: [bookkeeping, categorize, transactions]
category: Bookkeeping
featured: yes
image: ledger
integrations: [stripe, quickbooks, xero]
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Categorize Transactions

Ongoing categorization for pending transactions from connected ledger (QBO / Xero) or CSV drop  -  complement to `process-statements`, which owns PDF pipeline. Two invariants: CoA locked during run, low-confidence items go Suspense (no invented GL codes, no silent pushthrough).

Draft-only: categorize, flag, write review markdown. User (or accountant) posts to QBO / Xero.

## When to use

- "categorize these pending transactions" / "review QBO's pending queue" / "clean up Xero's uncategorized tray".
- Fresh CSV of pending items dropped at agent root or `transactions/_inbox/`.
- `mode=rule-add`  -  "make 'Stripe Fee' always go to 6700 going forward" / "lock 'AWS' to 6210 so you stop asking".
- Called by `process-statements` at end-of-run for rows that came out `uncategorized`  -  optional handoff.

## Steps

1. **Read context & lock the CoA.** Load:
   - `context/bookkeeping-context.md`  -  if missing, stop, ask user to run `define-bookkeeping-context` first.
   - `config/context-ledger.json`  -  accounts, suspense code, connected accounting slug hints.
   - `config/chart-of-accounts.json`  -  **lock it** for run. If absent, stop, ask user to run `build-chart-of-accounts` first. Never invent codes mid-run.
   - `config/prior-categorizations.json`  -  vendor → GL memory (empty object if absent).
   - `config/party-rules.json`  -  exact-match rules (empty object if absent).

2. **Resolve pending list.** Priority order:
   - **Connected app** (preferred): `composio search accounting`, pick QBO / Xero slug, pull current pending / uncategorized queue. Discover schema with `--get-schema`; never hardcode. If no connection, surface one-shot link command.
   - **File drop**: CSV at `transactions/_inbox/*.csv`  -  parse with stdlib `csv`. Required columns `{date, description, amount}`; optional `{account_last4, statement_date, party}`.
   - **Paste**: inline table in user's message.

3. **`mode=rule-add` branch.** If triggered:
   - Expect `{canonical_party, gl_code}` pairs (inline or file).
   - Per pair, validate `gl_code` exists in `config/chart-of-accounts.json`. If not, reject pair with named error  -  NEVER invent.
   - Read-merge-write `config/party-rules.json`: upsert `{canonical_party: gl_code}`. Atomic write (`.tmp` + rename).
   - Report one line per upsert; skip rest of skill.

4. **Canonicalize parties.** Per pending row, derive canonical party name same way `process-statements` does: strip noise prefixes (`POS DEBIT`, `CHECKCARD`, `ACH`, `SQ *`, `TST*`, `ONLINE PMT`), strip trailing reference numbers and city/state suffixes, collapse whitespace, Title Case. If cleaned name fuzzy-matches key in `prior-categorizations` or `party-rules` (token-set ratio ≥ 0.85), use stored key as canonical form.

5. **Categorize each transaction.** Priority order  -  stop at first hit:

   1. **`party-rules` exact match** → GL code from rule, `confidence: 1.00`, `source: "rule"`.
   2. **`prior-categorizations` fuzzy match** (token-set ratio ≥ 0.85 AND stored GL code exists in CoA) → stored GL code, `confidence: 0.95`, `source: "prior_year"`.
   3. **Reasoning against CoA**  -  pick best line from locked CoA using description + canonical party + amount + account type. Assign calibrated confidence:
      - `≥ 0.95`  -  obvious, unambiguous.
      - `0.90–0.94`  -  one reasonable candidate, not certain.
      - `< 0.90` → Suspense (next rule). `source: "ai"`.
   4. **Suspense**  -  `glCode` = `universal.suspenseCode.code`, `confidence: 0.50`, `source: "ai"`, `category_status: "uncategorized"`.

   `category_status` rules:
   - `ready_for_approval` if `confidence ≥ 0.90` AND `source ∈ {rule, prior_year}`.
   - `review_categorization` if `confidence ≥ 0.90` AND `source = "ai"`.
   - `uncategorized` if `confidence < 0.90`.

   Never invent GL code not in locked CoA.

6. **Write review batch** to `transactions/{YYYY-MM-DD}.md` (run date, not txn date). Structure:
   - Header: run date, source (app slug / CSV path), total count, total absolute dollar volume.
   - **Ready for approval**  -  table grouped by GL code, each row `{date | party | description | amount | glCode | glName | confidence | source}`.
   - **Needs review**  -  same table, one row per `review_categorization` item; include one-line "why this code" rationale.
   - **Suspense**  -  same table for `uncategorized` items, sorted desc by `abs(amount)`.
   - **Suggested party-rule upserts**  -  any canonical party appearing ≥ 3x this run with same AI-picked GL code and confidence ≥ 0.90. Rendered as ready-to-run `mode=rule-add` JSON so user approves in one step.

7. **Persist learnings** (only after user confirms `ready_for_approval` bucket, or end-of-run if no confirmation gate). Read-merge-write `config/prior-categorizations.json`: upsert `{canonical_party: gl_code}` for every row with `source ∈ {rule, prior_year}` OR `confidence ≥ 0.95`. NEVER persist `confidence < 0.90` items  -  poison next run.

8. **Update Suspense index.** Per `uncategorized` item, read-merge-write `suspense.json` at agent root with `{id, date, party, description, amount, addedAt}`. Bump `updatedAt` on existing entries; no duplicates.

9. **Append to `outputs.json`.** One row: `{type: "categorization", title: "Categorization batch {YYYY-MM-DD}", summary, path, status: "draft", domain: "transactions"}`. Read-merge-write; never overwrite array.

10. **Summarize to user.** One short block: counts by bucket, total Suspense dollars (flag prominently), new parties added, suggested party-rule upserts with exact command to approve.

## Outputs

- `transactions/{YYYY-MM-DD}.md`  -  review-ready categorized batch.
- `config/prior-categorizations.json`  -  read-merge-write; upserted with this run's high-confidence vendor memory.
- `config/party-rules.json`  -  only in `mode=rule-add`, read-merge-write with verified upserts.
- `suspense.json`  -  read-merge-write with new uncategorized items.
- `outputs.json`  -  one row appended, `type: "categorization"`.