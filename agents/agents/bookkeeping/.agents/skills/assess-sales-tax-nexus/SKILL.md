---
name: assess-sales-tax-nexus
description: "Use when the user says 'where do we owe sales tax' / 'nexus check' / 'sales-tax exposure by state' — I aggregate revenue + transaction count per US state from Stripe (via Composio) or invoices, compare against each state's economic-nexus threshold, rank states by exposure, and call out physical-nexus flags (employees / offices). Writes `compliance/sales-tax/{YYYY-QN}.md`. The user registers / files — this skill preps only."
---

# Assess Sales Tax Nexus

State-by-state economic-nexus check. Aggregate revenue + transaction count per US state for period, compare to state threshold, rank by exposure, flag physical-nexus triggers (employees / offices / inventory). User confirms registration + filing — never register, never remit.

## When to use

- "where do we owe sales tax" / "nexus check" / "sales-tax exposure by state".
- Quarterly — end of fiscal quarter.
- Company cross round-number revenue mark ($500K, $1M, $5M) or add employees in new state.

## Steps

1. **Read context.** Load `context/bookkeeping-context.md`, `config/context-ledger.json`, `config/chart-of-accounts.json`. Required ledger: `universal.company.state`, `domains.revenue.contractSource`, `domains.tax.stateFilingFootprint`. SaaS taxability vary by state — compute exposure regardless of taxability posture.

2. **Determine period.** Use user `{YYYY-QN}` if given; else most recent completed fiscal quarter. Also report trailing 12-month rolling view (most state thresholds measure this).

3. **Pull revenue by ship-to state.** Source priority:
   a. **Stripe via Composio.** `composio search billing` → discover Stripe slug → pull charges in period with customer billing / shipping state. SaaS use billing address; shipped goods use ship-to. Fall back to card country + postal code if address missing.
   b. **Invoices (CSV / paste).** User provides invoice-level data with state, amount, date, customer id.
   c. **Accounting system via Composio.** QBO / Xero customer list with state tags.
   None available → stop, ask for source. Never invent state attributions.

4. **Aggregate per state.** Sum revenue; count distinct transactions (thresholds use "separate transactions" — multi-line invoice = one; monthly subscription = 12 per year per customer).

5. **Compare against economic-nexus thresholds.** Use reference table (re-check current DOR guidance if cached date on ledger > 12 months old):

   | State | Threshold (OR unless noted) |
   |---|---|
   | CA | $500K revenue (no transaction count) |
   | NY | $500K revenue AND 100 transactions (both) |
   | TX | $500K revenue (no transaction count) |
   | FL | $100K revenue (no transaction count) |
   | IL | $100K OR 200 transactions |
   | MA | $100K (no transaction count) |
   | WA | $100K (no transaction count) |
   | CO | $100K (no transaction count) |
   | GA | $100K OR 200 transactions |
   | NC | $100K OR 200 transactions |
   | PA | $100K (no transaction count) |
   | OH | $100K OR 200 transactions |
   | VA | $100K OR 200 transactions |
   | MI | $100K OR 200 transactions |
   | NJ | $100K OR 200 transactions |
   | Default (all others) | $100K OR 200 transactions |

   "OR" states: cross either = nexus. "AND" states (NY): must cross both. Most measure over trailing 12 months or prior calendar year — note which per row.

6. **Crossing date.** For each crossed state, walk cumulative revenue + transactions month by month. Pinpoint crossing month. Most states give 30–60 day grace period to register.

7. **Physical-nexus flags.** Regardless of economic threshold:
   - Employees working in state (per `domains.payroll` / HRIS — ask if not captured). Any W-2 employee = physical nexus.
   - Offices / leased space.
   - Inventory (including FBA warehouses).
   - Contractors: generally do NOT create nexus (1099s don't count), but some states (e.g., TX) take aggressive positions — flag, don't auto-conclude.
   Physical nexus require registration regardless of revenue.

8. **Rank by exposure.** Sort crossed states by cumulative revenue (descending). Each row: state; revenue in period + rolling 12m; transactions in period + rolling 12m; threshold applied; date crossed; physical-nexus flag; cumulative exposure; next action ("Register via Avalara / TaxJar / direct DOR portal" / "Engage SALT advisor" / "Already registered per `stateFilingFootprint`" / "Monitor — below").

9. **Write `compliance/sales-tax/{YYYY-QN}.md`.** Atomic write. Structure:
   - **Summary** — states crossed, physical-nexus count, total exposed revenue, already-registered vs. new crossings.
   - **Crossed states** — table ranked by exposure.
   - **Physical-nexus-only** — states with physical presence but below economic threshold.
   - **Not crossed** — one-liner showing 3 closest to threshold (early warning).
   - **Taxability note** — remind user SaaS taxability varies by state; crossing threshold ≠ every sale taxable. Need DOR guidance on specific product — judgment call for SALT advisor.
   - **Filing note** — "Prep only. Registration via Avalara / TaxJar / direct state portals. Remittance / filing is on you."

10. **Append to `outputs.json`.** Row: `{type: "sales-tax-nexus", title: "Sales-tax nexus {YYYY-QN}", summary, path, status: "draft", domain: "compliance"}`. Read-merge-write.

11. **Summarize to user.** One paragraph: # states newly crossed, total exposure, top-3 by risk, physical-nexus flags, next move per crossed state. Never register, never remit.

## Outputs

- `compliance/sales-tax/{YYYY-QN}.md` (indexed as `sales-tax-nexus`)