---
name: prepare-offer-packet
description: "Use when you say 'prepare the offer packet for {candidate}' / 'first-hire paperwork' — I assemble offer letter + CIIAA + option grant notice + exercise agreement anchored to the current 409A (from `universal.entity.four09aDate`), write four markdown files + an index to `offer-packets/{candidate-slug}-{YYYY-MM-DD}/`, and flag `attorneyReviewRequired` if comp structure is non-standard. Drafts only — you send from your own email."
integrations:
  docs: [googledocs]
  files: [googledrive]
---

# Prepare Offer Packet

## When to use

- Explicit: "prepare the offer packet for {candidate}", "first-hire paperwork", "draft the offer for {name}", "assemble offer + CIIAA + option grant".
- Implicit: `draft-document` called with `offer-letter` + user says role includes equity — loop this skill in, not standalone letter.
- One packet per candidate. Re-run same candidate = new dated folder (no overwrite).

## Packet contents

1. **Offer letter** — at-will language + base comp + start date + ref to CIIAA + ref to option grant.
2. **CIIAA** (Confidential Information + Invention Assignment Agreement) — IP assignment, confidentiality, non-solicit (if template has one), prior inventions schedule.
3. **Option grant notice** — option count, strike price, vesting schedule (default 4-year, 1-year cliff), grant date, exercise deadline.
4. **Exercise agreement** — form grantee uses to exercise.
5. **Index (`index.md`)** — one-page summary: candidate, role, comp, option count, strike, vesting, packet contents, next steps ("send these 4 docs via your signing platform; file 83(b) within 30 days of share issuance if exercising early").

## Inputs required

From user (ask one at a time if missing):
- `candidate` (full legal name)
- `role` (title)
- `baseComp` (annual salary)
- `startDate` (ISO-8601)
- `optionCount` (options in grant)
- `vestingSchedule` (default: "4 years, 1-year cliff, monthly after cliff" — confirm)

From `config/cap-table.json` (pull; ask if missing):
- `strikePrice` (current 409A)
- `last409AAt` (if > 12 months ago, flag + ask whether to refresh before issuing)
- `optionPoolRemaining` (confirm enough pool for grant)

From `context/legal-context.md`:
- Entity name, state, authorized shares.

## Steps

1. **Read shared context**: `context/legal-context.md`. If missing/empty, tell user run `define-legal-context` first, stop.
2. **Read `config/cap-table.json`.** If missing, ask ONE question: "I need your current 409A strike price and pool state — connect Carta / Pulley via Composio, or paste the strike + last-409A date + pool remaining." Write to `config/cap-table.json`.
3. **Check freshness.** If `last409AAt` older than 12 months: set `attorneyReviewRequired: true`, tell user "409A is stale — Compliance Ops's `track-legal-state` (scope=deadlines) should have flagged this. Refresh before issuing, or issue with a caveat."
4. **Gather candidate variables.** Ask one at a time until `candidate`, `role`, `baseComp`, `startDate`, `optionCount`, `vestingSchedule` all captured. Never invent.
5. **Check non-standard comp.** Flag `attorneyReviewRequired: true` if any: base comp above founder's market range in shared context; option count outside plan's per-grant limits; vesting deviates from 4/1; grant includes acceleration (single-trigger or double-trigger); cash bonus or signing bonus present; grant for advisor equity (different shape — FAST agreement or separate template).
6. **Render four docs.** Pull `offer-letter` + `ciiaa` templates from `config/template-library.json`. Pull `option grant notice` + `exercise agreement` from same library (add via `audit-compliance` (scope=template-library) if missing — stop + ask if absent). Substitute variables. Every dollar, share count, date from input — never invented.
7. **Write packet** atomically to `offer-packets/{candidate-slug}-{YYYY-MM-DD}/` with:
   - `offer-letter.md`
   - `ciiaa.md`
   - `option-grant-notice.md`
   - `exercise-agreement.md`
   - `index.md`
   Each with header `> Draft — pending your review. I don't send, file, or request signatures.`
8. **Append to `outputs.json`** — one entry for packet (path = directory), `type: "offer-packet"`, `attorneyReviewRequired` per step 5, `summary` naming candidate + role + total grant value at strike.
9. **Summarize to user** — one paragraph: "Packet for {candidate} ({role}, ${baseComp}, {optionCount} options @ ${strike}) at `offer-packets/{slug}/`. Review, then send via your signing platform. After execution: (a) candidate has 30 days to file 83(b) if early-exercising; (b) run `track-legal-state` (scope=counterparties) to capture grant in tracker. Flagged attorney review: {y/n, reason}."

## Never invent

Never invent strike price, pool balance, or 409A date. If missing or stale, stop + ask. Never auto-set vesting acceleration — judgment call.

## Outputs

- `offer-packets/{candidate-slug}-{YYYY-MM-DD}/` with 4 `.md` files + `index.md`.
- Appends to `outputs.json` with type `offer-packet`.