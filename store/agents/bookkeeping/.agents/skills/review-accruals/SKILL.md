---
name: review-accruals
description: "Use when the user says 'list our active accruals' / 'refresh the accruals register' / 'are any accruals stale' / 'what reversing entries are due'  -  I recompute current balances for every active accrual (prepaid rent, prepaid SaaS, deferred revenue, PTO, accrued payroll, accrued interest), flag stale items, and surface reversing-entry candidates. Reads `accruals.json` + `journal-entries.json` + CoA; rewrites `accruals/register.md` and upserts `accruals.json`."
version: 1
tags: [bookkeeping, review, accruals]
category: Bookkeeping
featured: yes
image: ledger
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Review Accruals

Living register of every accrual books carry. Each run recomputes balances from underlying journal entries, classifies each row (`active` / `reversed` / `stale` / `written-off`), surfaces reversing-entry candidates for current period. Register live doc  -  rewritten in place, NOT indexed in `outputs.json`.

## When to use

- "list our active accruals" / "refresh the accruals register".
- "are any accruals stale" / "anything I should reverse".
- "what reversing JEs are due this month".
- Called by `run-monthly-close` after reconciliations, before `prep-journal-entry` dispatches reversing batch.

## Steps

1. **Read context.** Load `context/bookkeeping-context.md`, `config/context-ledger.json`, `config/chart-of-accounts.json`. CoA missing → stop, ask user run `build-chart-of-accounts` first. Note today's date + current accounting period (`YYYY-MM`).

2. **Read current accruals index.** Load `accruals.json` at agent root (empty array if absent). Row schema: `{id, accrualName, glCode, currentBalance, reversing, lastActivity, status: "active" | "reversed" | "stale" | "written-off", notes, createdAt, updatedAt}`. Keep in-memory list keyed by `id`.

3. **Read supporting JEs.** Load `journal-entries.json`, filter to entries whose `lines[].glCode` matches any accrual's `glCode`, ordered by `date` ascending. Activity history used to recompute balances.

4. **Recompute current balances.** For each active accrual row:
   - Sum all JE line debits + credits against its `glCode` since row's `createdAt`.
   - Apply sign convention based on natural balance of GL account type (asset: debit-positive; liability/deferred revenue: credit-positive).
   - Update `currentBalance`. Update `lastActivity` to max JE `date` hitting this GL. No JEs → leave `lastActivity` unchanged.

5. **Discover net-new accruals.** Any `glCode` appearing in `chart-of-accounts.json` under `statementSection` containing `"prepaid"`, `"deferred"`, `"accrued"`, or `"pto"` but no row in `accruals.json` → create new row. Infer `accrualName` from GL name + first JE memo. `status: "active"`. Default `reversing: false` unless source JE had `reversing: true`.

6. **Classify status.**
   - `active`  -  `abs(currentBalance) > 0.00` AND `lastActivity` within last 90 days.
   - `stale`  -  `abs(currentBalance) > 0.00` AND `lastActivity` older than 90 days. Flag as write-off-or-reclass candidate. Note recommended action in `notes` ("consider reclass to {X}" or "candidate for write-off JE").
   - `reversed`  -  `abs(currentBalance) <= 0.01` AND reversing JE exists referencing original accrual.
   - `written-off`  -  only user can set. Never transition automatically.

7. **Identify reversing-entry candidates for current period.** Row is reversing candidate if:
   - `reversing: true` (original accrual booked as reversing), AND
   - status is `active`, AND
   - current period strictly after accrual's origination period, AND
   - no reversing JE yet exists for this `id`.

   Collect into `reversing_candidates` list with suggested reversal amount (negative of `currentBalance`) + originating JE id.

8. **Rewrite `accruals/register.md`.** Living doc  -  overwrite in place. Structure:
   - **Summary**  -  counts by status, total prepaid balance, total deferred revenue balance, total accrued liabilities balance.
   - **Active accruals**  -  one row per active accrual with `accrualName`, `glCode`, `currentBalance`, `lastActivity`, `reversing` flag.
   - **Reversing-entry candidates this period**  -  numbered list with suggested JE memo + amount; user runs `prep-journal-entry type=accrual` to draft each.
   - **Stale accruals (>90 days no activity)**  -  table with recommended action per row.
   - **Recently reversed**  -  last period's reversals for traceability.
   - **Written-off**  -  historical tail; keep last 6 months.

   Atomic write: `accruals/register.md.tmp` → rename.

9. **Upsert `accruals.json`.** Read-merge-write:
   - Read current file.
   - Each row in recomputed list: `id` matches → update mutable fields (`currentBalance`, `lastActivity`, `status`, `notes`, `updatedAt`). New `id` → append.
   - Preserve `createdAt`  -  never touch.
   - Never drop rows no longer in recompute; mark `written-off` only if user explicitly confirmed.
   - Atomic write: `accruals.json.tmp` → rename.

10. **DO NOT append to `outputs.json`.** Register is living doc. `accruals.json` flat-at-root index, not deliverable.

11. **Summarize to user.** One paragraph: how many actives / stale / reversing-candidates this period, total carrying balance, exact next move (e.g., "2 reversing JEs due  -  run `prep-journal-entry type=accrual` on each"). Never propose posting; drafts only.

## Outputs

- `accruals/register.md` (living document  -  NOT indexed in outputs.json)
- `accruals.json` (flat-at-root index  -  upserted, not overwritten)