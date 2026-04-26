---
name: hand-off-to-tax
description: "Use when user says 'close the year for the tax preparer' / 'prep the tax tie-out' / 'hand off to our CPA'  -  first run `audit-books` (open items block handoff); then assemble trial balance + reconciliations + fixed-asset / depreciation schedules + 1099 list + R&D classification + M-1 adjustment candidates + judgment-call notes. Writes `handoffs/tax-{year}/`. Optional Google Drive mirror. Drafts email to tax preparer  -  never sends."
version: 1
tags: [bookkeeping, hand, off]
category: Bookkeeping
featured: yes
image: ledger
integrations: [googledrive, gmail, outlook]
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Hand Off to Tax

Year-end tax-handoff package. Gated by `audit-books`  -  books must
be clean first. Once clean, assembles full tax tie-out under
`handoffs/tax-{year}/`, optionally mirrors to Google Drive,
drafts email to tax preparer with folder link. Never files. Never
sends.

## When to use

- "close the year for the tax preparer" / "prep the tax tie-out" /
  "hand off to our CPA" / "year-end package for tax".
- Run once per fiscal year, after final month's
  `run-monthly-close` completes.

## Steps

1. **Read context.** Load `context/bookkeeping-context.md`,
   `config/context-ledger.json`, `config/chart-of-accounts.json`.
   Required ledger: `universal.company` (legal name, EIN, entity
   type, fiscal year), `universal.accountingMethod`,
   `domains.tax.preparerName`, `domains.tax.preparerEmail`,
   `domains.tax.rdCreditEligible`. Ask for missing preparer
   contact (file > paste) and cache.

2. **Determine tax year.** If specified, use it; else default to
   most recently completed fiscal year per
   `universal.company.fiscalYearEnd`.

3. **Gate  -  run `audit-books` first.** Invoke `audit-books`
   skill for period ending fiscal-year-end. If findings remain
   (suspense, recon breaks > $100 age > 30 days, stale accruals,
   stuck draft JEs, cutoff candidates, opening-balance gaps,
   high-priority vendor merges), STOP. Surface blocker list with
   audit path; ask user to close each (or explicitly confirm each
   immaterial). Do not proceed until user clears gate.

4. **Trial balance.** Invoke `generate-financial-statements` with
   `statement=trial-balance` and `as-of = fiscal year-end`. Write
   to `handoffs/tax-{year}/trial-balance.md`. Must balance within
   1 cent.

5. **Reconciliation summaries.** For each account in
   `domains.banks.accounts[]`, copy final monthly recon from
   `reconciliations/{account_last4}/{YYYY-MM}.md` into handoff
   folder, plus one roll-up per account at
   `handoffs/tax-{year}/reconciliations/{account_last4}.md`
   (opening → monthly activity → ending → unmatched items  -
   should be empty or documented from audit gate).

6. **Fixed-asset schedule.** Read `config/fixed-assets.json`
   (absent → ask user if any capitalized assets exist; if none,
   skip). Include per asset: in-service date, acquisition cost,
   method (SL / MACRS class), useful life, accumulated
   depreciation to year-end, net book value. Write to
   `handoffs/tax-{year}/fixed-asset-schedule.md`.

7. **Depreciation schedule.** Compute full-year straight-line
   from fixed-asset schedule (half-year convention default; note
   at top). Write to
   `handoffs/tax-{year}/depreciation-schedule.md`. Book
   depreciation only  -  tax depreciation (MACRS, §179, bonus) is
   preparer's computation.

8. **1099 list.** Invoke `track-vendor-1099s` for tax year (skip
   email-drafting step if already run). Copy
   `compliance/1099s/{year}.md` → `handoffs/tax-{year}/1099-
   list.md`.

9. **R&D classification (if eligible).** If
   `domains.tax.rdCreditEligible == "yes"`, invoke
   `classify-rd-expenses` for year and copy
   `compliance/rd-credit/{year}.md` →
   `handoffs/tax-{year}/rd-classification.md`. Else skip with
   one-liner in cover memo.

10. **M-1 adjustment candidates.** Write
    `handoffs/tax-{year}/m1-adjustments.md` listing common
    book/tax differences with amounts from books:
    - **Meals**  -  50% disallowance on restaurant meals; 100%
      disallowance on most other meals post-2023. Split by memo
      where possible; flag `TBD` otherwise.
    - **Stock-based compensation**  -  book SBC expense vs. tax
      timing (tax deducts at exercise / vest per plan).
    - **Accrual-to-cash differences**  -  if returning on cash
      basis while books accrual, list accrued-liability + AR
      balances at year-end. Skip if both accrual.
    - **Federal income tax expense**  -  book deduction, tax
      add-back.
    - **Unearned revenue**  -  deferred-revenue balance at
      year-end (cash basis picks up differently).
    - **Other non-deductibles**  -  penalties, fines, entertainment
      (post-TCJA), political contributions.
    Each row: book amount, direction (add-back / deduction),
    memo. Flag every judgment call  -  preparer finalizes.

11. **Judgment-call notes.** Walk `outputs.json` for fiscal year
    and collect every "judgment-call" callout (from
    `calculate-revenue-recognition`, `classify-rd-expenses`,
    `prep-journal-entry type=stock-comp`, etc.). Write to
    `handoffs/tax-{year}/judgment-calls.md` with per-item
    entries: what decided, by whom, when, alternatives
    considered. Preparer's audit trail.

12. **Cover memo.** `handoffs/tax-{year}/cover-memo.md`  -  one
    page. Company block (legal name, EIN, entity type, state,
    fiscal year-end); accounting posture; package contents
    (bulleted with links); book net income; top 3–5 items for
    preparer's attention; open TBDs; signoff line.

13. **Optional Google Drive mirror.** If `composio search files`
    returns connected Drive slug: create folder `Tax Handoff
    {YYYY}  -  {Legal Name}`, upload every file from
    `handoffs/tax-{year}/` preserving subfolders, share with
    `domains.tax.preparerEmail` as commenter (never editor).
    Capture URL in cover memo header. Skip silently if Drive not
    connected.

14. **Draft preparer email.** If `composio search inbox` returns
    connected Gmail / Outlook slug, create inbox draft (never
    send) to `domains.tax.preparerEmail`, subject `"{Legal Name}
    {YYYY} tax handoff package"`, body referencing cover memo +
    Drive URL (or local folder path) with short summary of
    package and major items. Save draft id/URL in cover memo
    under "Draft email to preparer". If no inbox connection,
    write email text to `drafts/tax-preparer-handoff-{year}.md`.

15. **Append to `outputs.json`.** Row:
    `{type: "tax-handoff", title: "Tax handoff {year}", summary,
    path: "handoffs/tax-{year}/cover-memo.md", status: "draft",
    domain: "compliance"}`. Read-merge-write. Flip to `ready`
    when user confirms review; `posted` only when they confirm
    sent to preparer.

16. **Summarize to user.** One paragraph: package at
    `handoffs/tax-{year}/`, components included, book net income,
    remaining TBDs, Drive URL (if mirrored), email draft id /
    path, reminder I never send  -  they review and send.

## Outputs

- `handoffs/tax-{year}/cover-memo.md` (indexed as `tax-handoff`)
- `handoffs/tax-{year}/trial-balance.md`
- `handoffs/tax-{year}/reconciliations/{account_last4}.md` (one
  per account)
- `handoffs/tax-{year}/fixed-asset-schedule.md`
- `handoffs/tax-{year}/depreciation-schedule.md`
- `handoffs/tax-{year}/1099-list.md`
- `handoffs/tax-{year}/rd-classification.md` (if eligible)
- `handoffs/tax-{year}/m1-adjustments.md`
- `handoffs/tax-{year}/judgment-calls.md`
- Optional Google Drive folder mirror (URL in cover memo)
- Inbox draft to tax preparer (never sent)