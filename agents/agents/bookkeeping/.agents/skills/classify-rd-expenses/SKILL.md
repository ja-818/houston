---
name: classify-rd-expenses
description: "Use when the user says 'tag R&D spend for the credit' / 'Section 174 breakout' / 'classify R&D expenses for {year}' — I bucket qualified R&D spend (wages for qualified services, supplies, cloud / computer leasing, contract research at 65%) by project + category, with exclusions called out. Reads run transactions + `journal-entries.json`; writes `compliance/rd-credit/{year}.md`. Supports — the tax preparer files Form 6765."
---

# Classify R&D Expenses

Section 174 / R&D-credit support for tax year. Bucket qualified spend into four IRS categories (wages, supplies, cloud / computer leasing, contract research at 65%), by project if project list available, exclusions listed so tax preparer + user review. Support only — no Form 6765 filing.

## When to use

- "tag R&D spend for the credit" / "Section 174 breakout" / "classify R&D expenses for {year}".
- Called by `hand-off-to-tax` when `domains.tax.rdCreditEligible == "yes"`.
- Before year-end handoff, surface missing project tags or uncertain R&D-vs-G&A calls.

## Steps

1. **Read context.** Load `context/bookkeeping-context.md`, `config/context-ledger.json`, `config/chart-of-accounts.json`. Required ledger: `universal.company`, `domains.payroll`, `domains.tax.rdCreditEligible`. If `rdCreditEligible == "no"`, warn but proceed if user confirms (state credits / Section 174 amortization still use this breakout).

2. **Determine tax year.** Use user's year if specified; else current running draft year.

3. **Role → R&D% map (one-time, cached).** If `domains.payroll.rdWagePctByRole` missing, ask once: defaults engineering 100%, product 50%, design 25%, non-technical 0%; user overrides. Write atomically.

4. **Project list (one-time, cached).** If `config/rd-projects.json` absent, ask user for one line per project (name + description). Write `[{slug, name, description}]` atomically. If declined, use one bucket: "Unallocated R&D".

5. **Pull qualified transactions.** Read every `runs/*/run.json` whose period overlaps tax year; also `journal-entries.json` for JEs posted in year (payroll accruals, cloud accruals).

6. **Bucket 1 — Wages for qualified services.** From payroll JEs (or direct from Gusto / Rippling / Justworks via Composio): per employee, get role + gross wages, multiply by role R&D%, sum. Cite each row by JE id + employee name. Exclude founders' non-technical time, G&A roles, all stock comp (wages only).

7. **Bucket 2 — Supplies.** Transactions under CoA `"supplies"` / `"rd-supplies"`. Typical for hardware / biotech; usually $0 for pure SaaS. Materials **consumed** in research only — capital equipment goes through depreciation.

8. **Bucket 3 — Computer leasing / cloud.** Walk transactions for canonical parties like `{AWS, Amazon Web Services, GCP, Azure, Digital Ocean, Linode, Vercel, Fly.io, Render, Netlify, Heroku, Cloudflare}` plus others from `prior-categorizations.json` under cloud/hosting GL codes. Ask user for R&D portion (default 100% pre-revenue; revenue-producing companies split production vs. R&D). Cache to `domains.tax.cloudRdPct`.

9. **Bucket 4 — Contract research at 65%.** Transactions under `"contractor"` / `"professional-services"` / `"consulting"` where vendor does qualified R&D (engineering contractors, research consultants, prototype fab). Code caps inclusion at 65% — `qualified = 0.65 * payment`. Cite every transaction.

10. **Allocate across projects.** Assign each qualified row to project:
    - Payroll: ask per-person splits (default: even across active projects). Cache per person.
    - Cloud: default even split unless user provides per-project cost tags.
    - Contractors: infer from transaction description / invoice memo; fall back to user confirm.
    - Supplies: infer from PO / memo if available.
    Unallocated rows roll into "Unallocated R&D".

11. **Exclusions.** Call out spend that looks like R&D but not qualified per Treas. Reg. §1.41:
    - Routine data collection (customer analytics, BI dashboards for operations).
    - Post-commercial-release improvements (minor bug fixes, cosmetic UI on shipped features).
    - Funded research (another party owns results AND bears risk).
    - Duplication of existing business component.
    - Management / G&A of R&D (project-management time not doing qualified research).
    - Marketing, market research, advertising.
    Surface each with citations + rule invoked. Exclude from qualified total. User overrides.

12. **Write `compliance/rd-credit/{year}.md`.** Atomic write. Structure:
    - **Summary** — total qualified R&D spend; breakdown by category + project. One headline: qualified-research expense total.
    - **Per-project breakdown** — project × category matrix with row + column totals.
    - **Per-category detail** — row-level detail per category (employee or vendor, amount, project allocation) with citations.
    - **Exclusions** — what pulled out, with citations + rule.
    - **Judgment-call notes** — role-% assumptions, cloud R&D%, any uncertain vendor. User decides; I flag options.
    - **Filing note** — "Support only. The tax preparer files Form 6765 (federal) and any state equivalents. Section 174 capitalization / 5-year amortization is a separate return computation."

13. **Append to `outputs.json`.** Row: `{type: "rd-classification", title: "R&D credit support {year}", summary, path, status: "draft", domain: "compliance"}`. Read-merge-write.

14. **Summarize to user.** One paragraph: total qualified spend, per-category totals, per-project totals if projects defined, count of judgment calls, reminder that preparer files Form 6765 — not me.

## Outputs

- `compliance/rd-credit/{year}.md` (indexed as `rd-classification`)
- `config/rd-projects.json` (cached project list, if provided)
- Ledger updates: `domains.payroll.rdWagePctByRole`, `domains.tax.cloudRdPct`, per-employee project splits