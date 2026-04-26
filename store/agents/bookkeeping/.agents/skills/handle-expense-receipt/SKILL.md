---
name: handle-expense-receipt
description: "Use when the user forwards a receipt image / PDF / email or says 'categorize this founder reimbursement' / 'book this Amex charge that's not in the feed' / 'process these receipts'  -  I extract vendor + date + amount + line items (multimodal Read), pick the best GL code against the locked CoA (confidence ≥ 0.90 else Suspense), draft a balanced double-entry JE, and write `expenses/{YYYY-MM-DD}-{slug}.md` + append to `journal-entries.json`. Sub-mode `mode=batch` processes N receipts into one summary JE crediting Founder Loan Payable or Accrued Reimbursements. Draft-only  -  I never post."
version: 1
tags: [bookkeeping, handle, expense]
category: Bookkeeping
featured: yes
image: ledger
integrations: [gmail, outlook, quickbooks, xero]
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Handle Expense Receipt

One receipt → one categorized expense + one balanced JE. For founder reimbursements, out-of-pocket vendor payments, or receipts not in bank / card feed. Invariant: every receipt either produces balanced JE with GL code validated against CoA, or lands in Suspense with image attached.

Draft-only: JE written at `status: "draft"`. Never auto-post to QBO / Xero.

## When to use

- User forwards single receipt (image, PDF, email) or says "book this receipt" / "categorize this reimbursement".
- Expense absent from bank / card feed (reimbursed on personal card, ACH paid from another entity, cash).
- `mode=batch`  -  "process these 20 receipts for Q1" / "book founder's reimbursement batch"  -  produces one summary JE crediting Founder Loan Payable (or Accrued Reimbursements if same-period).

## Steps

1. **Read context & lock the CoA.** Load `context/bookkeeping-context.md` (stop if missing  -  ask for `define-bookkeeping-context`), `config/context-ledger.json`, `config/chart-of-accounts.json` (**locked** for run  -  stop if absent), `config/prior-categorizations.json`, and `config/party-rules.json`.

2. **Resolve receipt inputs.** Priority order:
   - **Inline attachment**  -  Read tool (multimodal) on file path user provided. Works on PDF and images (JPG / PNG / HEIC).
   - **Email forward**  -  `composio search inbox`, pick Gmail / Outlook slug, fetch message by ID or thread, then Read attachment files.
   - **File drop**  -  `expenses/_inbox/*.{pdf,jpg,png,heic,eml}` at agent root.

3. **Extract fields per receipt** via multimodal Read:
   - `vendor`  -  raw merchant name as printed.
   - `date`  -  YYYY-MM-DD; if only `MM-DD` printed, infer year from context.
   - `total`  -  positive dollar amount (invert for JE credit side).
   - `lineItems[]`  -  optional, when receipt itemizes: each `{description, amount, quantity?}`.
   - `paymentMethod`  -  "personal card" / "corp card 9041" / "cash" / "ACH"  -  ask once if unreadable.
   - `taxAmount`, `tipAmount`  -  when itemized separately.
   - `currency`  -  default USD; if foreign, record and ask once for home-currency amount as settled.

   If any required field (vendor / date / total) unextractable, stop and ask ONE targeted question. Never guess.

4. **Canonicalize party**  -  same recipe as `categorize-transactions`: strip noise prefixes and reference numbers, Title Case. Fuzzy-match (token-set ratio ≥ 0.85) against `prior-categorizations` / `party-rules`; prefer stored key as canonical form.

5. **Pick GL code.** Priority order:
   1. Exact match in `party-rules` → `confidence: 1.00`, `source: "rule"`.
   2. Fuzzy match in `prior-categorizations` (ratio ≥ 0.85, stored code in CoA) → `confidence: 0.95`, `source: "prior_year"`.
   3. Reason against locked CoA via vendor + description + line items + amount + founder context (travel vs. office vs. R&D contractor). Confidence `≥ 0.90` → `source: "ai"`.
   4. Else → Suspense (`glCode = universal.suspenseCode.code`, confidence `0.50`, `category_status: "uncategorized"`).

   Never invent GL codes. If receipt has clearly separable lines (e.g., meals + hotel on one hotel folio), split into multiple debit lines.

6. **Draft JE.** Balanced double-entry, one per receipt:
   - **Debits**  -  categorized expense line(s) by `glCode`.
   - **Credit**  -  determined by `paymentMethod`:
     - `corp card {last4}` → credit card's GL (`context-ledger.domains.banks.accounts[].glCode` for that last4). Note: later dedupes against card feed  -  flag `supportingDocs` so `reconcile-account` catches double-book.
     - `personal card` / `cash` / reimbursed → credit `Founder Loan Payable` (look up in CoA; ask ONCE to register if absent).
     - `ACH` from another entity → credit `Due to Related Party` or `Founder Loan Payable`, whichever applies.
   - Memo: `"{vendor}  -  {date}  -  {short description}"`.
   - Every `glCode` validated against `config/chart-of-accounts.json`.
   - `sum(debits) === sum(credits)` within 1 cent.
   - `status: "draft"`, `reversing: false`, `period` = `YYYY-MM` of receipt date.

7. **`mode=batch` branch.** If triggered:
   - Do Steps 2–5 for every receipt in batch.
   - Produce per-receipt expense markdown (Step 8) for traceability.
   - Produce ONE summary JE: one debit line per unique GL code (summed across receipts), one credit:
     - `Accrued Reimbursements` if receipts same-period and reimbursement not yet done.
     - `Founder Loan Payable` if founder floated expenses (common pre-seed).
   - `supportingDocs[]` lists every per-receipt markdown path.
   - Memo: `"Founder reimbursement batch  -  {N} receipts  -  {period}"`.

8. **Write per-receipt expense doc** to `expenses/{YYYY-MM-DD}-{vendor-slug}.md`. Structure:
   - Header: vendor, date, amount, payment method, confidence, source.
   - Line items table (if itemized).
   - **JE (draft)**  -  balanced entry inline, markdown table `{glCode | glName | debit | credit | memo}`.
   - Attached receipt path (copied into `expenses/_attachments/` on first sight).
   - Open questions (if any field asked inline).

9. **Update indexes**  -  all read-merge-write, atomic (`.tmp` + rename):
   - `journal-entries.json` at agent root  -  append JE with full schema from `data-schema.md` (`id, date, type: "adjustment" | "reclass", memo, reversing: false, period, lines[], status: "draft", supportingDocs[]`).
   - If category lands in Suspense, append to `suspense.json`.
   - `outputs.json`  -  one row per receipt `{type: "expense-receipt", title, summary, path, status: "draft", domain: "transactions"}`. In batch mode, also append summary row `{type: "journal-entry", title: "Reimb batch {period}", ...}`.

10. **Summarize to user.** One compact block:
    - Receipt count, total dollars, bucket split (categorized / Suspense).
    - GL-code histogram (top 3 codes with amounts).
    - Path(s) to expense doc(s) and drafted JE(s).
    - Reminder: JE is `draft`  -  user posts to QBO / Xero.

## Outputs

- `expenses/{YYYY-MM-DD}-{slug}.md`  -  one file per receipt (batch mode too, for traceability).
- `expenses/_attachments/`  -  receipt files copied from `_inbox/` or Composio fetch.
- `journal-entries.json`  -  read-merge-write, JE appended at `status: "draft"`.
- `suspense.json`  -  only if any line hit Suspense.
- `outputs.json`  -  one row per receipt + summary row in batch mode.