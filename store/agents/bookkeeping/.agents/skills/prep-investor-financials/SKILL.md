---
name: prep-investor-financials
description: "Use when the user says 'draft the board financials pack' / 'prep investor update financials' / 'build the Q{N} investor pack'  -  I assemble a board-ready package from the latest close (exec summary + P&L + BS + cash flow + SaaS KPIs + cohort retention + runway). Reads `closes/{YYYY-MM}/`, `runway/*.md`, `revrec/`; writes `investor-financials/{yyyy-qq}.md`. Sub-mode `mode=saas-metrics` refreshes MRR/ARR/GM/NRR only. Never sends."
version: 1
tags: [bookkeeping, prep, investor]
category: Bookkeeping
featured: yes
image: ledger
integrations: [googledocs]
---


# Prep Investor Financials

Board/investor pack from latest close. One-page exec summary top (cash, burn, runway, MRR/ARR, GM, headcount, top-3 variance); full statements + startup KPIs + cohort retention + runway sensitivity below. Optional Google Docs mirror via Composio. Never send  -  draft only.

## When to use

- "draft the board financials pack" / "prep investor update financials" / "build the Q{N} investor pack".
- `mode=saas-metrics`  -  "refresh MRR/ARR" / "what's our NRR this month"  -  skip full pack, write metrics-only file.
- After `run-monthly-close` finishes quarter-end month, or any time user wants fresh pack between closes.

## Steps

1. **Read context.** Load `context/bookkeeping-context.md`, `config/context-ledger.json`, `config/chart-of-accounts.json`. Required ledger fields: `universal.company`, `universal.accountingMethod`, `domains.revenue.model`, `domains.investors.anchorKpis`. Missing field → one targeted question with modality hint (connected app > file > URL > paste), write atomically before continuing.

2. **Locate latest close.** List `closes/*/package.md`, pick most recent `YYYY-MM`. If latest close `draft` in `outputs.json`, warn user, ask: proceed on draft or wait. Record close period as pack's as-of date.

3. **Locate latest runway report.** List `runway/*.md`, pick most recent by filename date. Read cash balance, net burn (3- and 6-month), runway months, top-3 cost-driver sensitivities.

4. **Read revrec schedules.** SaaS/subscription models → load every `revrec/{customer-slug}/{contract-slug}.json`. Current MRR = sum active monthly recognition per contract. ARR = MRR * 12.

5. **Compute MRR waterfall (if SaaS).** Trailing 12 months of revrec schedules:
   - **New MRR**  -  contracts whose first recognition month in period.
   - **Expansion MRR**  -  increases on existing customer contracts (upsell, seat expansion).
   - **Contraction MRR**  -  decreases on existing customer contracts (downgrade, seat reduction).
   - **Churn MRR**  -  contracts whose recognition stopped in period (customer gone).
   - Net New MRR = New + Expansion − Contraction − Churn.
   Cite every delta with `revrec/{customer}/{contract}.json` path + contract id.

6. **Compute NRR over trailing 12-month cohort.** Cohort = customers active 12 months ago. NRR = (current MRR from cohort) / (MRR from cohort 12 months ago). Report as percent. Only compute if contract data spans ≥ 13 months.

7. **Compute gross margin.** GM% = (Revenue − COGS) / Revenue, from latest close P&L. Pull revenue + COGS lines straight from `closes/{YYYY-MM}/package.md`.

8. **Compute CAC payback (optional).** If marketing + S&M spend identifiable on P&L AND new MRR computed: CAC = S&M spend / new logos; CAC payback months = CAC / (new MRR * GM%). Report only if both inputs real numbers  -  else mark `TBD  -  needs marketing-spend attribution`.

9. **Build cohort retention table (if contract data).** Rows = cohort month (first contract month); columns = months since acquisition (M0..M12+); cells = retained MRR / cohort M0 MRR. One row per cohort month. Include only if ≥ 6 cohorts exist.

10. **Assemble pack** at `investor-financials/{yyyy-qq}.md`. Quarter slug: `2026-q1`, `2026-q2`, etc.  -  derive from close period's month. Structure:
    1. **Exec summary (one page)**  -  cash balance, 3-month avg net burn, runway months, MRR, ARR, GM%, headcount, top-3 variance drivers vs. prior quarter.
    2. **P&L**  -  copy from close.
    3. **Balance sheet**  -  copy from close.
    4. **Cash flow**  -  copy from close.
    5. **SaaS KPIs (if applicable)**  -  MRR waterfall, ARR, NRR, GM%, CAC payback.
    6. **Cohort retention table** (if ≥ 6 cohorts).
    7. **Runway + sensitivity**  -  copy from latest runway report.
    8. **Judgment-call notes**  -  any position needing user confirmation (churn definition edge cases, CAC scope).

    Every KPI cites source (close path + line, revrec paths, runway path). No invented numbers.

11. **Optional Google Docs mirror.** If `composio search docs` returns connected Docs slug, mirror pack to new Doc, include URL at top of `.md`. No connection → skip silently.

12. **`mode=saas-metrics` branch.** Skip steps 3, 9, 10 full assembly. Write `investor-financials/metrics-{YYYY-MM}.md` with only: MRR (current + waterfall), ARR, GM%, NRR. No Docs mirror.

13. **Atomic write.** `.tmp` + rename onto target path.

14. **Append to `outputs.json`.** Row: `{type: "investor-financials", title: "Investor pack {yyyy-qq}" | "SaaS metrics {YYYY-MM}", summary, path, status: "draft", domain: "reporting"}`. Read-merge-write.

15. **Summarize to user.** One paragraph: what assembled, which close period basis, headline numbers (cash, burn, runway, ARR, GM%), any `TBD` items, next move (user reviews; never send). Never post, never mail.

## Outputs

- `investor-financials/{yyyy-qq}.md` (full pack, indexed in `outputs.json` as `investor-financials`)
- `investor-financials/metrics-{YYYY-MM}.md` (sub-mode only, same type in `outputs.json`)
- Optional Google Docs mirror (URL captured in `.md` header)