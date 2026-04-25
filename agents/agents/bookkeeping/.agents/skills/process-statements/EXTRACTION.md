# Extraction — Named Layout Patterns

When reading a PDF statement, identify its layout pattern first. Each pattern has specific pitfalls. Generic "just extract all transactions" regresses on edge cases — always pattern-match first.

## How to Read a PDF

Use the Read tool on the PDF path. The tool returns the PDF visually (multimodal). Read all pages. If the PDF is >10 pages, use the `pages` parameter and iterate in chunks of 10 or fewer.

```
Read(file_path="/abs/path/to/statement.pdf", pages="1-10")
Read(file_path="/abs/path/to/statement.pdf", pages="11-20")
```

Always accumulate transactions across chunks; be careful not to double-count a transaction that appears at a page boundary.

## Pattern 1: Standard Checking/Savings Statement

**Signals:** sections titled "Deposits and Additions", "Withdrawals", "Checks Paid", one running-balance column.

**How to read:**
- Each section has implicit sign: Deposits = positive, Withdrawals = negative.
- The running balance column is NOT the transaction amount. The transaction amount is in its own column.
- Summary rows like "Total Deposits", "Total Withdrawals", "Beginning Balance", "Ending Balance" are metadata, not transactions.

## Pattern 2: Bare Date+Amount Tables

**Signals:** no section headers, just a flat table with date, description, amount, balance.

**How to read:**
- Date is always leftmost, amount always rightmost of the transaction row, running balance (if present) is rightmost-most.
- Sign is determined by position: if there are separate "debit" and "credit" columns, use column to assign sign. If there's one signed amount column, trust the sign.
- Description is everything between date and amount — may span multiple lines; join with a space.

## Pattern 3: Multi-Period PDF (quarterly/annual bundle)

**Signals:** more than one "Statement Period" or "Beginning Balance" / "Ending Balance" pair in the document. Often delivered as 12 monthly statements concatenated into one PDF.

**How to read:**
- Treat each period as a SEPARATE statement object. They each have their own opening/closing, their own reconciliation.
- Same account_last4 across all of them — they consolidate into one bank account, but as many statements.
- Do not merge transaction lists across periods — a Dec 31 closing balance and a Jan 1 opening balance are both real data points and should reconcile independently.

## Pattern 4: Credit Card Statement

**Signals:** "New Balance", "Minimum Payment Due", "Payment Due Date", "Previous Balance".

**Sign convention — IMPORTANT:**
- Credit card statements typically print purchases as positive ("$45.67 Amazon") and payments as negative.
- You MUST FLIP this so money out (purchases) is negative and money in (payments/credits) is positive, from the business's perspective. This aligns credit card transactions with checking account transactions in the Transactions sheet.
- `opening_balance` on a credit card = previous balance owed (typically a positive number in statement, store as negative — it's a liability).
- For reconciliation: `opening + sum(transactions) ≈ closing`, where purchases are negative and payments positive. Verify this holds.

**Transaction types:**
- Purchases → expense, negative
- Payments ("PAYMENT THANK YOU") → positive, categorize as `9100 Credit Card Payment` (transfer)
- Interest charges → negative, categorize as `6010 Bank Service Charges` or a dedicated interest line
- Cash advances → negative, usually `3000 Owner's Draw` unless for ops
- Credits/refunds → positive, reverse the original expense category

## Pattern 5: Continued-on-Next-Page

**Signals:** transactions list spans a page break, sometimes with a "Continued on next page" footer.

**How to read:**
- Just concatenate — don't treat the break as a section boundary.
- Watch for running-balance anchor: the last balance on page N should equal the first balance on page N+1 (if there's a balance column). If they don't match, you've missed or duplicated a transaction.

## Pattern 6: Scanned Image PDF (no text layer)

**Signals:** the Read tool returns something that looks like OCR noise — weird character swaps (O↔0, l↔1), missing spaces, line breaks in unexpected places.

**How to read:**
- Do your best on each transaction; flag low confidence.
- Reconciliation check will catch most OCR errors (the sum won't match).
- If reconciliation fails by a clean multiple of ~$X, you probably misread one digit — re-examine the largest transactions.
- Surface OCR'd statements prominently in the summary so the user can spot-check.

## Common Extraction Errors to Avoid

- **Including "Beginning Balance" / "Ending Balance" rows as transactions** — they're metadata.
- **Missing the last transaction on the last page** — check that your extracted list ends with the date closest to `period_end`.
- **Reading the running balance as the transaction amount** — the transaction amount is the delta, not the balance.
- **Dropping the sign on credits** — every transaction has a sign; don't store amounts as magnitudes only.
- **Missing interest / fees / overdraft charges** — they're often in their own small section at the end. Include them.
- **Treating a check's memo field as a separate transaction** — it's part of one transaction row.
- **Foreign currency**: the statement typically shows both the foreign amount and the settled home-currency amount. Use the home-currency amount; include the foreign amount in the description (e.g. "Airbnb (€89.00 → $97.21 @ 1.0923)").

## What to Output

For each statement found in a PDF, emit a dict like:

```python
{
  "source_pdf": "statement_2025_01.pdf",
  "bank_name": "Chase",
  "account_last4": "1234",
  "account_type": "checking",
  "period_start": "2025-01-01",
  "period_end": "2025-01-31",
  "opening_balance": 12345.67,
  "closing_balance": 14567.89,
  "transactions": [
    {
      "date": "2025-01-03",
      "description": "AMAZON.COM*AB12C NJ",
      "amount": -45.67,
      "source_page": 2,
    },
    ...
  ]
}
```

Keep the raw `description` exactly as printed. Canonicalization into `party` happens in Step 4, not here.
