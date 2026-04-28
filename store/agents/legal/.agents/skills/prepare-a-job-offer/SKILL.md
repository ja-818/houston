---
name: prepare-a-job-offer
description: "Put together a full job offer pack for someone you want to hire. You get the offer letter, the IP and confidentiality agreement, the stock-option grant, and the exercise paperwork, all anchored to your current stock price. Drafts only, you sign and send."
version: 1
tags: [legal, hiring, entity]
category: Hiring
featured: yes
image: scroll
integrations: [googledocs, googledrive]
---


# Prepare a Job Offer

## When to use

- Explicit: "prepare the offer packet for {candidate}", "first-hire paperwork", "draft the offer for {name}", "assemble offer + CIIAA + option grant".
- Implicit: `draft-a-legal-document` called with `offer-letter` + user says role includes equity  -  loop this skill in, not standalone letter.
- One packet per candidate. Re-run same candidate = new dated folder (no overwrite).

## Packet contents

1. **Offer letter**  -  at-will language + base comp + start date + ref to CIIAA + ref to option grant.
2. **CIIAA** (Confidential Information + Invention Assignment Agreement)  -  IP assignment, confidentiality, non-solicit (if template has one), prior inventions schedule.
3. **Option grant notice**  -  option count, strike price, vesting schedule (default 4-year, 1-year cliff), grant date, exercise deadline.
4. **Exercise agreement**  -  form grantee uses to exercise.
5. **Index (`index.md`)**  -  one-page summary: candidate, role, comp, option count, strike, vesting, packet contents, next steps ("send these 4 docs via your signing platform; file 83(b) within 30 days of share issuance if exercising early").

## Inputs required

From user (ask one at a time if missing):
- `candidate` (full legal name)
- `role` (title)
- `baseComp` (annual salary)
- `startDate` (ISO-8601)
- `optionCount` (options in grant)
- `vestingSchedule` (default: "4 years, 1-year cliff, monthly after cliff"  -  confirm)

From `config/cap-table.json` (pull; ask if missing):
- `strikePrice` (current 409A)
- `last409AAt` (if > 12 months ago, flag + ask whether to refresh before issuing)
- `optionPoolRemaining` (confirm enough pool for grant)

From `context/legal-context.md`:
- Entity name, state, authorized shares.

## Steps

1. **Read shared context**: `context/legal-context.md`. If missing/empty, ask the user in plain language: "I need a few basics about your company first to fill in this offer (entity, state, authorized shares). Want to set those up now?" Then run `set-up-my-legal-info` if yes. Stop until that's done.
2. **Read `config/cap-table.json`.** If missing, ask ONE question in plain language: "What's your current stock-option strike price, when was your last 409A done, and how many options are still in your pool? You can connect Carta or Pulley if you use one." Write to `config/cap-table.json`.
3. **Check freshness.** If `last409AAt` older than 12 months: set `attorneyReviewRequired: true`, tell user in plain language: "Your stock-price valuation (409A) is more than a year old. You'll usually want to refresh it before issuing options. I can flag this and proceed with a note, or wait until you refresh."
4. **Gather candidate variables.** Ask one at a time until `candidate`, `role`, `baseComp`, `startDate`, `optionCount`, `vestingSchedule` all captured. Never invent.
5. **Check non-standard comp.** Flag `attorneyReviewRequired: true` if any: base comp above founder's market range in shared context; option count outside plan's per-grant limits; vesting deviates from 4/1; grant includes acceleration (single-trigger or double-trigger); cash bonus or signing bonus present; grant for advisor equity (different shape  -  FAST agreement or separate template).
6. **Render four docs.** Pull `offer-letter` + `ciiaa` templates from `config/template-library.json`. Pull `option grant notice` + `exercise agreement` from same library (add via `audit-compliance` (scope=template-library) if missing  -  stop + ask if absent). Substitute variables. Every dollar, share count, date from input  -  never invented.
7. **Write packet** atomically to `offer-packets/{candidate-slug}-{YYYY-MM-DD}/` with:
   - `offer-letter.md`
   - `ciiaa.md`
   - `option-grant-notice.md`
   - `exercise-agreement.md`
   - `index.md`
   Each with header `> Draft  -  pending your review. I don't send, file, or request signatures.`
8. **Append to `outputs.json`**  -  one entry for packet (path = directory), `type: "offer-packet"`, `attorneyReviewRequired` per step 5, `summary` naming candidate + role + total grant value at strike.
9. **Summarize to user.** Plain language. One short paragraph: "Your offer pack for {candidate} ({role}, ${baseComp}, {optionCount} options at ${strike}) is ready. Review it and send it through your signing tool. Two reminders: (1) once they sign, the 30-day clock for filing an 83(b) starts (only relevant if they early-exercise); (2) I'll log this grant for you. {Attorney review needed: yes/no — reason if yes}." Never name file paths or internal tools.

## Never invent

Never invent strike price, pool balance, or 409A date. If missing or stale, stop + ask. Never auto-set vesting acceleration  -  judgment call.

## Outputs

- `offer-packets/{candidate-slug}-{YYYY-MM-DD}/` with 4 `.md` files + `index.md`.
- Appends to `outputs.json` with type `offer-packet`.