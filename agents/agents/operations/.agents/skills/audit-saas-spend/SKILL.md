---
name: audit-saas-spend
description: "Use when you say 'audit my SaaS spend' / 'what am I paying for' / 'find the subscriptions I forgot about' — I aggregate subscriptions from your contract library, Stripe, and connected inbox receipts, flag duplicates, unused tools, and top cancel candidates. Writes to `saas-audits/{YYYY-MM-DD}.md`."
integrations:
  billing: [stripe]
  inbox: [gmail, outlook]
---

# Audit SaaS Spend

Surprise-reveal skill. Most solo founders not know annualized SaaS spend. Surface in one file.

## When to use

- "audit my SaaS spend".
- "what am I paying for".
- "find the subscriptions I forgot about".
- "how much are we spending on tools".

## Steps

1. **Read `context/operations-context.md`** — stage + vendor posture anchor severity thresholds. If missing: stop, ask for `define-operating-context`.

2. **Read `config/procurement.json`** — `knownVendors` = known list; anything NOT on list found during audit = potential forgotten-subscription.

3. **Aggregate sources.**

   - **Source A — contract library (`contracts/`).** Every parsed contract yields subscription. Pull: vendor, amount if known, billing frequency, renewal date.
   - **Source B — connected billing.** `composio search billing` → list-subscriptions / list-charges. Pull recurring charges from last 12 months. Normalize to annualized amount.
   - **Source C — inbox receipts.** `composio search inbox` → search for `receipt OR "subscription renewed" OR "payment confirmed" OR invoice` in last 90 days. Extract sender domain + amount + date. Catches subs not on card.

4. **Deduplicate across sources.** Match on (normalized vendor name) + (amount ± 5%) + (billing frequency). Same sub in two sources → merge, note all sources.

5. **Annualize every entry.** Monthly × 12, quarterly × 4, annual × 1.

6. **Detect patterns.**

   - **Duplicates / overlaps.** Two project-management tools? Three password managers? Two note apps? Flag with 1-line "consider consolidating to {one}."
   - **Unused tools.** For each subscription, attempt usage check: `composio search {category}` → provider have last-login or usage API? If no, fallback to "last receipt date" vs. "last activity in connected inbox" as proxy. Flag anything with no proxy-activity in 60+ days.
   - **Forgotten subs.** Any found in Source B or C NOT in `knownVendors` or `contracts/` → call out explicitly.
   - **Price drift.** If prior audit exists at `spend/` and vendor's annualized amount jumped >15%, flag.

7. **Produce output** (save to `spend/{YYYY-MM-DD}-audit.md`):

   - **Headline** — total annualized spend, count of subscriptions.
   - **Spend table** — ordered by annualized amount descending. Columns: Vendor | Category | Annualized | Billing | Next renewal | Last activity | Flag.
   - **Duplicates / overlaps** — grouped by category.
   - **Unused (no activity 60+ days)** — list with evidence.
   - **Forgotten subscriptions** — stuff not in `config/procurement.json` or `contracts/`.
   - **Price drift** — deltas vs prior audit.
   - **Top 3 cancel candidates** — 3 highest-leverage cancels (high annualized + low usage + no auto-renew trap). Each with 3-line rationale.

8. **Atomic writes** — `*.tmp` → rename.

9. **Append to `outputs.json`** with `type: "spend-audit"`, status "ready".

10. **Suggest next moves.**
    - For each top cancel candidate: "ready to draft cancel email? Use `draft-vendor-outreach` with `purpose: cancel`."
    - If forgotten subs exist and contracts missing: "run `extract-contract-clauses` on {vendor} once you've located contract."

## Outputs

- `spend/{YYYY-MM-DD}-audit.md`
- Appends to `outputs.json` with `type: "spend-audit"`.

## What I never do

- **Cancel a subscription.** I identify candidates; founder decides; `draft-vendor-outreach` writes draft; founder sends.
- **Move money, modify billing details, or change payment methods.** Read-only on billing.
- **Treat billing data as system-of-record.** Sources disagree → surface disagreement — don't pick winner silently.