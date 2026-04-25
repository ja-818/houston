---
name: extract-contract-clauses
description: "Use when you say 'pull the {clauses} from this contract' / 'what's the auto-renew language in every contract in this folder' — I parse one or many contracts, extract standard clauses with verbatim quotes + plain-language summaries + flags on unfavorable terms. Also updates the renewal calendar."
integrations:
  files: [googledrive]
---

# Extract Contract Clauses

## When to use

- "pull the {clause} from this contract" (single doc).
- "what are the auto-renew terms in every contract in this folder" (batch).
- "extract the liability cap and termination language from {vendor}'s MSA".

## Steps

1. **Read `context/operations-context.md`.** If missing: stop, ask user run `define-operating-context` skill first. Vendor posture + hard nos anchor "unfavorable terms" flags.

2. **Read `config/procurement.json`** — approval posture decide which terms count as "flag worthy" (conservative founder flag more; fast-risk founder flag only truly egregious).

3. **Identify target contract(s).**
   - Single file: user paste text, share URL, or point at file in connected drive.
   - Batch (folder): `composio search drive` → list files in specified folder → filter to contract-flavored (PDF/DOCX/DOC).
   - Named vendor: look in `contracts/` first; if absent, search drive via `composio search drive`.

4. **Parse each contract.** Use `composio search doc-processing` to find best doc-processing tool for format (OCR for scanned PDFs, text extractor for native PDFs, DOCX reader). Execute by slug, pull full text.

5. **Extract standard clauses.** Per contract, locate + extract:
   - **Liability cap** — quote + cap amount + carve-outs.
   - **Termination** — for-cause terms, for-convenience terms, notice windows.
   - **Auto-renewal** — presence, term length, notice-to-not-renew window.
   - **Payment terms** — amount, frequency, true-up / overage, late fees.
   - **IP ownership** — who own work product, background IP rules.
   - **Data handling / DPA** — DPA presence, data residency, breach notification SLA.
   - **SLA** — uptime commitment, remedies.
   - **Exclusivity / non-compete** — presence + scope.

   Per clause: **verbatim quote** + **1-line plain-language summary** + **1-line flag** if unusual or unfavorable per vendor posture. If clause absent, mark `ABSENT` explicit — never omit.

6. **Write** to `contracts/{vendor-slug}-{YYYY-MM-DD}.md` with full extraction. Batch runs: one file per contract + `contracts/batch-{YYYY-MM-DD}-summary.md` rolling up flags across batch.

7. **Update renewal calendar.** If contract has renewal date, call `track-renewals` skill internally (or note `track-renewals` should re-run) and add/update entry in `renewals/calendar.md`.

8. **Atomic writes** — `*.tmp` → rename.

9. **Append to `outputs.json`** with `type: "contract"`, status "ready" per contract. Batch: single `contract` entry for summary + one per contract processed.

10. **Summarize to user** — #1 flag that most warrant founder attention (e.g. "auto-renew is in 11 days and notice window is 30 days — already too late to stop this one"). Path to file(s).

## Outputs

- `contracts/{vendor-slug}-{YYYY-MM-DD}.md` (one per contract)
- Optional `contracts/batch-{YYYY-MM-DD}-summary.md` (batch runs)
- Updates to `renewals/calendar.md`
- Appends to `outputs.json` with `type: "contract"`.

## What I never do

- **Sign** or accept any contract.
- **Invent** clause. If contract has no liability cap, mark `ABSENT`.
- **Interpret legally.** Flag for founder attention; founder consult legal.