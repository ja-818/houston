# Default Chart of Accounts

Use this CoA unless the user provides a custom one. Codes are 4-digit; keep them stable.

Every transaction must resolve to one of these codes. If nothing fits, use **6200 Suspense** — never invent a new code mid-run.

## Income (4000s) — appears on P&L as Revenue

| Code | Name | Notes |
|------|------|-------|
| 4000 | Sales Revenue | Primary product/service revenue, Stripe/Square payouts, invoicing platforms |
| 4100 | Service Revenue | Consulting, contract fees |
| 4200 | Interest Income | Bank interest earned |
| 4300 | Refunds Received | Vendor refunds, expense reimbursements |
| 4900 | Other Income | Anything that's income but doesn't fit above |

## Cost of Goods Sold (5000s) — appears on P&L as COGS

| Code | Name | Notes |
|------|------|-------|
| 5000 | Cost of Goods Sold | Direct inventory purchases, materials |
| 5100 | Merchant Processing Fees | Stripe/Square/PayPal fees (the fees, not the payouts) |
| 5200 | Shipping & Fulfillment | Shipping to customers, fulfillment services |
| 5300 | Subcontractor - COGS | Labor directly tied to delivering a product/service |

## Operating Expenses (6000s) — appears on P&L as Expenses

| Code | Name | Typical vendors |
|------|------|-----------------|
| 6000 | Advertising & Marketing | Google Ads, Meta Ads, Mailchimp, sponsorships |
| 6010 | Bank Service Charges | Monthly account fees, wire fees, overdraft |
| 6020 | Dues & Subscriptions | Trade associations, non-software memberships |
| 6030 | Insurance | Liability, E&O, property, health (if business-paid) |
| 6040 | Legal & Professional | Attorney, accountant, bookkeeper fees |
| 6050 | Meals | Restaurants, client meals (always check if >50% rule applies) |
| 6060 | Office Supplies | Staples, Amazon office supplies, printing |
| 6070 | Rent | Office rent, coworking |
| 6080 | Repairs & Maintenance | Equipment repair, building maintenance |
| 6090 | Software & Technology | SaaS: Slack, Notion, GitHub, Adobe, AWS, Google Workspace, Microsoft 365 |
| 6100 | Telephone & Internet | Cell, business internet, VOIP |
| 6110 | Travel | Flights, hotels, rideshare, rental cars |
| 6120 | Utilities | Electric, gas, water, trash (NOT internet — that's 6100) |
| 6130 | Payroll | Wages paid through payroll provider (Gusto, ADP, Rippling) |
| 6140 | Payroll Taxes | Employer portion of FICA, FUTA, SUTA |
| 6150 | Contract Labor | 1099 contractor payments (NOT W-2 payroll) |
| 6160 | Vehicle Expense | Gas, vehicle repairs, tolls, parking |
| 6170 | Training & Education | Courses, books, conferences |
| 6180 | Postage & Shipping - OpEx | USPS/UPS/FedEx for business mail (not fulfillment) |
| 6190 | Other Expenses | Legitimate business expense, doesn't fit above |
| 6200 | **Suspense** | **Default for confidence < 0.90. Must be reviewed before finalizing.** |

## Owner / Equity (3000s) — NOT on P&L, on Balance Sheet

| Code | Name | Notes |
|------|------|-------|
| 3000 | Owner's Draw | Money out to owner (not payroll) |
| 3010 | Owner's Contribution | Money in from owner |

## Transfers (9000s) — NOT on P&L, excluded from all totals

| Code | Name | Notes |
|------|------|-------|
| 9000 | Internal Transfer | Movement between the client's own accounts. Both legs get this code. |
| 9100 | Credit Card Payment | Payment from checking to credit card — transfer, not expense |
| 9200 | Loan Principal | Principal portion of loan payments (interest goes to 6010 or a dedicated interest expense line) |

## Categorization Heuristics

- **Stripe / Square / PayPal deposits** → `4000 Sales Revenue` (NOT the gross — statements show net after fees, so the fee is already baked in. If the statement shows gross + fee separately, book gross to 4000 and fee to 5100.)
- **"PAYMENT THANK YOU"** on a credit card statement → `9100 Credit Card Payment` (paired with the matching debit from checking)
- **Venmo / Zelle / Cash App** → inspect description. Could be income, owner draw, or expense. Don't default-categorize — usually send to Suspense unless the description is clear.
- **ATM withdrawals** → `3000 Owner's Draw` by default (unless the business truly needs cash for ops).
- **"INTEREST CHARGED"** on a credit card → `6010 Bank Service Charges` (or a dedicated interest expense line if the client wants one).
- **Refunds from a vendor** → same GL code as the original charge, with a negative amount. Do NOT book to 4300 if it's a reversal of a specific expense — 4300 is for miscellaneous refund income.

## Custom CoA Override

If the user provides a custom CoA (as a CSV, markdown, or inline list), parse it and use it instead. Required fields per account: `code`, `name`, `type` (one of: Income, COGS, Expense, Equity, Transfer, Asset, Liability).

Lock the CoA at the start of categorization. Adding accounts mid-run breaks the P&L formulas.
