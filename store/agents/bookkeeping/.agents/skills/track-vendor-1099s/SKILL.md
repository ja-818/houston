---
name: track-vendor-1099s
description: "Use when the user says 'who are our 1099 vendors' / 'prep the 1099 list for {year}' / '1099 chase emails'  -  I compute YTD payments per vendor for the tax year, flag 1099-eligible vendors (non-corporate, ≥ $600), separate NEC from MISC, cross-reference W-9 status, draft chase emails for missing W-9s. Writes `compliance/1099s/{year}.md` + `drafts/1099-chase-{vendor-slug}.md`. Preps only  -  never files, never sends."
version: 1
tags: [bookkeeping, track, vendor]
category: Bookkeeping
featured: yes
image: ledger
integrations: [gmail, outlook]
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Track Vendor 1099s

1099-NEC / 1099-MISC prep for tax year. Computes YTD payments per vendor from run transactions, flags eligibility, splits NEC from MISC, cross-refs W-9 status from `files/`, drafts chase emails for missing W-9s (saved as drafts + optional inbox drafts  -  never sent). User files via IRS FIRE, Track1099, or Tax1099  -  skill never files.

## When to use

- "who are our 1099 vendors" / "prep the 1099 list for {year}".
- "draft chase emails for missing W-9s".
- Called by `hand-off-to-tax` as part of year-end package.
- Called in January for prior tax year (IRS deadline: Jan 31 for NEC).

## Steps

1. **Read context.** Load `context/bookkeeping-context.md`, `config/context-ledger.json`, `config/chart-of-accounts.json`. Required ledger: `universal.company` (legal name + EIN for 1099 payer block), `domains.tax` (preparer name / email for cover note).

2. **Determine tax year.** User specified year → use it. Called in January no year → default to prior calendar year (`today.year - 1`)  -  that 1099 cycle. Called mid-year → use current year as running draft.

3. **Aggregate YTD payments per vendor.** Read every `runs/*/run.json` whose period overlaps tax year. Filter transactions to `amount < 0` (money out), group by `party` (canonical name). Sum absolute amounts per party within tax year date range. Cite every transaction by `(run period, date, amount)`  -  no invented payments.

4. **Exclude payments not 1099-reportable.**
   - Transfers (`gl_code == "9000"` / `source == "transfer"`).
   - Payments to corporations (S-corp / C-corp exempt except specific categories like attorney fees). Default-assume corporate if canonical party ends in `Inc`, `Corp`, `LLC` (W-9 confirms), `Corporation`, `Ltd`. Flag for user confirm  -  default exclude.
   - Payroll payments (go on W-2, not 1099).
   - Credit-card payments to vendor. Vendor paid exclusively via credit card → card issuer issues 1099-K  -  exclude from list. Flag any vendor paid only via CC.
   - Reimbursements labeled pass-through.

5. **Apply 1099 eligibility thresholds.**
   - **1099-NEC**  -  contractors / services (GL categories: professional services, contract labor, consulting, engineering contractors). Threshold: ≥ $600 YTD.
   - **1099-MISC**  -  rent, attorney fees (even if incorporated), prizes, medical payments, other. Threshold: ≥ $600 YTD.
   - Flag vendors straddling categories (e.g., law firm paid for both services and settlement)  -  user decides split.

6. **Cross-reference W-9 status.** Check `files/` (or user-provided vendor-W9 folder) for PDF matching each eligible vendor canonical name (fuzzy match, token-set-ratio ≥ 0.85). Record W-9 status per vendor: `have-w9` / `missing-w9` / `pending`. Vendor list with W-9 indicators provided at runtime → merge in.

7. **Draft chase emails for missing W-9s.** For every vendor flagged `missing-w9`:
   - Write `drafts/1099-chase-{vendor-slug}.md`  -  subject line, body, signature. Body references tax year, $ threshold, Form W-9 link (`https://www.irs.gov/pub/irs-pdf/fw9.pdf`), asks for return by specified date (default: Jan 15 for prior-year filing).
   - `composio search inbox` returns connected Gmail / Outlook slug → create inbox draft (never send) using vendor email if known from prior correspondence; include draft URL / id in `.md`. No connection → skip inbox step silently.
   - Cite canonical party, YTD paid, source run periods in draft body so user can verify before sending.

8. **Write `compliance/1099s/{year}.md`.** Atomic write. Structure:
   - **Payer block**  -  legal name, EIN, state.
   - **Summary**  -  NEC count, NEC $ total, MISC count, MISC $ total, missing-W-9 count.
   - **NEC recipients**  -  table: canonical party, YTD paid, GL category breakdown, W-9 status, address (from W-9 if present; else `TBD`).
   - **MISC recipients**  -  same table shape.
   - **Excluded**  -  corporate exclusions, CC-only, payroll, transfers  -  one-line reason per row (so user can audit exclusions).
   - **Straddle cases**  -  vendors where NEC/MISC split needs judgment call, with options.
   - **Filing note**  -  "Prep only. File via IRS FIRE, Track1099, or Tax1099. Deadline: Jan 31 (NEC to recipient + IRS), Feb 28 paper / Mar 31 electronic (MISC to IRS)."

9. **Append to `outputs.json`.** Row: `{type: "vendor-1099-list", title: "1099 list {year}", summary, path: "compliance/1099s/{year}.md", status: "draft", domain: "compliance"}`. Read-merge-write.

10. **Summarize to user.** One paragraph: NEC count + $, MISC count + $, missing-W-9 count with chase-email paths, any straddle cases needing call, filing reminder ("I preplied  -  you file via FIRE / Track1099 / Tax1099"). Never file. Never send.

## Outputs

- `compliance/1099s/{year}.md` (indexed in `outputs.json` as `vendor-1099-list`)
- `drafts/1099-chase-{vendor-slug}.md` (one per missing W-9  -  not indexed; drafts)
- Optional inbox drafts in Gmail / Outlook via Composio (never sent)