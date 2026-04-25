---
name: audit-books
description: "Use when the user says 'are the books clean' / 'what's uncategorized' / 'books health check' / 'audit response' — I sweep uncategorized items, recon breaks, stale accruals, cutoff candidates, draft JEs, missing opening balances, and duplicate vendors; rank by dollar impact; produce `audits/{YYYY-MM-DD}.md`. Sub-mode `mode=audit-response` handles auditor / DD requests with reproducible sample selection. Never files."
---

# Audit Books

Books-in-shape health check. Sweep every flat-at-root index + living registers. Produce dollar-ranked punch list + one "close this week" call-out. Sub-mode `mode=audit-response` handle auditor / diligence requests with documented random seeds. Drafts only — never post, never file.

## When to use

- "are the books clean" / "what's uncategorized" / "books health check" / "punch list".
- Called by `hand-off-to-tax` as gating step — open items must close before handoff proceed.
- `mode=audit-response` — "respond to this audit request" / "diligence wants samples for Q2" / "walk the auditor through revrec".

## Steps

1. **Read context.** Load `context/bookkeeping-context.md`, `config/context-ledger.json`, `config/chart-of-accounts.json`. Note today's date as run date.

2. **Load indexes.** Read `suspense.json`, `recon-breaks.json`, `accruals.json`, `journal-entries.json`, `outputs.json`, `run-index.json` (all flat at agent root).

3. **Uncategorized / suspense.** From `suspense.json` — every open item with age (today − createdAt). Aggregate by canonical party. Surface total suspense balance + aging buckets (0–30, 31–60, 61–90, 90+ days).

4. **Recon breaks.** From `recon-breaks.json` — every open break with `abs(amount) > $100` AND age > 30 days. Cite `reconciliations/{account_last4}/{YYYY-MM}.md`.

5. **Stale accruals.** From `accruals.json` — rows where `status == "stale"` OR `lastActivity > 90 days` AND `abs(currentBalance) > 0`. Include recommended action already written by `review-accruals`.

6. **Cutoff candidates.** Walk recent `journal-entries.json` + latest close's transactions:
   - Expenses dated in prior period but booked in current (missed cutoff).
   - Current-period transaction dates booked into prior period (possible cutoff reversal).
   List each with JE id, amount, period gap.

7. **Stuck draft JEs.** From `journal-entries.json` — entries with `status == "draft"` AND `updatedAt > 14 days`. Cite `id`, `date`, `memo`, total amount.

8. **Opening-balance gaps.** Compare GL codes used across recent runs against `config/opening-trial-balance.json`. Any code in runs but missing from opening TB → flag (likely new account without opening balance, or code that shouldn't be in use).

9. **Duplicate vendors.** From `config/prior-categorizations.json` keys, cluster canonical names by token-set-ratio ≥ 0.85. Include each variant's GL code — if differ, flag high priority.

10. **Rank by dollar impact.** Score each finding by absolute dollar affected. Sort descending. Top item become "most-useful item to close this week" call-out.

11. **Write `audits/{YYYY-MM-DD}.md`.** Atomic write. Structure:
    - **Close this week** — one item, highest impact, with recommended action.
    - **Summary counts** — suspense, recon breaks, stale accruals, cutoff candidates, stuck JEs, opening-balance gaps, vendor-merge candidates.
    - **Findings ranked by dollar impact** — citation (JE id, suspense id, recon path), dollar, recommended action, estimated resolution time.
    - **Judgment calls** — positions requiring user's call (e.g., "write off $420 stale prepaid rent? [write-off | reclass | leave]") with options, never a decision.

12. **Append to `outputs.json`.** Row: `{type: "books-audit", title: "Books health check {YYYY-MM-DD}", summary, path, status: "draft", domain: "reporting"}`. Read-merge-write.

13. **`mode=audit-response` branch.** Skip steps 3–11 sweep. Instead:
    a. **Parse the request.** User provide auditor's ask (paste / file / URL). Split into discrete items: sample selections, walkthroughs, document requests.
    b. **Sample selections.** For "pull N samples of {type}":
       - Deterministic seed: `seed = "{YYYY-MM-DD}-{item-slug}"`. Document in output.
       - Filter population by criteria (period, GL code, amount range).
       - Sort deterministically (by `id` ASC).
       - Seed PRNG to pick N indices — e.g., `random.Random(seed).sample(range(len(pop)), N)`.
       - Export sample + seed used (auditor can reproduce).
    c. **Walkthroughs.** Summarize from `context/bookkeeping-context.md` + relevant skill outputs. Cite skill outputs by path. Never invent process detail.
    d. **Document requests.** Assemble docs into `handoffs/audit-{yyyy-qq}/{request-slug}/` (create subfolder if absent). Include `README.md` listing every file + source path.
    e. **Judgment calls.** Flag positions requiring call (materiality thresholds, going-concern language, segment disclosure) with options — user decides. Never answer on user's behalf.
    f. **Cover memo.** Write to `audits/{YYYY-MM-DD}-response-{request-slug}.md` listing every item, response status, file paths, seeds used. Append to `outputs.json` as `books-audit` with title `"Audit response {request-slug}"`.

14. **Summarize to user.** One paragraph: top finding + dollar impact, counts by category, single recommended next move. Response mode: items answered / pending, package location, unresolved judgment calls.

## Outputs

- `audits/{YYYY-MM-DD}.md` (health check — indexed as `books-audit`)
- `audits/{YYYY-MM-DD}-response-{request-slug}.md` (response mode)
- `handoffs/audit-{yyyy-qq}/{request-slug}/` (document bundles for response mode)