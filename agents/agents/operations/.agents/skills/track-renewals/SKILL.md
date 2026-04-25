---
name: track-renewals
description: "Use when you say 'build my renewal calendar' / 'what's renewing this quarter' / 'update the renewal calendar' — I scan `contracts/` and any connected Google Drive, extract renewal dates + notice windows + auto-renew language, and maintain the living `renewals/calendar.md` plus a quarterly digest."
integrations:
  files: [googledrive]
---

# Track Renewals

Maintain single most load-bearing file on agent: `renewals/calendar.md`. Agent read during `run-weekly-review`.

## When to use

- "build my renewal calendar" / "update the renewal calendar".
- "what's renewing in the next 90 days / this quarter".
- "run the renewal scan".
- Called as sub-step of `extract-contract-clauses` after parsing contract — skill nudge `track-renewals` to refresh calendar with new entry.

## Steps

1. **Read `context/operations-context.md`** — hard nos + vendor posture set "negotiate before auto-renew" flag threshold. Missing: stop, ask for `define-operating-context`.

2. **Read `config/procurement.json`** — especially `approvalPosture` (risk appetite adjust lead-time tiers: conservative = longer lead, fast = shorter).

3. **Source contracts.**

   - **contracts/** — every file is clause extraction. Parse for renewal date + notice window + auto-renew presence.
   - **Connected drive** — if `contractRepository.kind = "connected-storage"`, run `composio search drive` → list files → check for any not in `contracts/` yet (call `extract-contract-clauses` as sub-step for new ones — or surface as "unparsed: run extract-contract-clauses first" to user).
   - **Billing provider** — `composio search billing` → list subscriptions with renewal dates. Use only for tools without formal contracts.

4. **Extract per-entry data.**

   Per contract/subscription: `{ vendor, amount_if_known, nextRenewalDate, noticeWindowDays, autoRenew, contractPath, source }`.

5. **Compute lead-time tier per entry** (days until renewal):
   - **7 days** — urgent; if autoRenew and past notice-window, flag "renewal imminent — cannot stop".
   - **30 days** — hot; founder decide now.
   - **60 days** — warm; negotiate window open.
   - **90 days** — cool; scoping window.
   - **beyond** — parked.

   Risk-appetite adjustments from `procurement.json`:
   - conservative → bump everything up one tier.
   - fast → leave defaults.

6. **Write `renewals/calendar.md`** atomically. LIVE file — overwrite every time.

   Structure:

   ```markdown
   # Renewal Calendar

   _Last scan: {ISO-8601} · Contracts scanned: {N}_

   ## Next 7 days ({M})
   - {Vendor} · {YYYY-MM-DD} · auto-renew:{Y/N} · notice-window-passed:{Y/N} · amount:{$if known} · path:{contracts/...md}

   ## Next 30 days ({M})
   ...

   ## Next 90 days ({M})
   ...

   ## Beyond 90 days ({M})
   ...
   ```

   Inside each tier, sort by date ascending.

   **File NOT indexed in `outputs.json`.** Live document.

7. **Produce quarterly digest** if triggered ("quarterly" mode) or if within 14 days of quarter-end. Save to `renewals/{YYYY-QN}-digest.md`:

   - **Upcoming this quarter** — ordered list.
   - **Already past notice-to-cancel window** — if any, called out separately.
   - **Top negotiation candidates** — 2-3 renewals where contract terms + founder posture suggest room to negotiate (e.g. annual commitments with usage mismatch).
   - **Scope-adjustment candidates** — tools mostly unused but renewing.

   File IS indexed in `outputs.json` with `type: "renewal-digest"`.

8. **Atomic writes** — `*.tmp` → rename.

9. **Append to `outputs.json`** with `type: "renewal-digest"` only for digest runs. Calendar refreshes don't append.

10. **Summarize to user** — "N contracts scanned. M renewing in next 30d. One to act on first: {vendor} — {reason}. Open renewals/calendar.md for full list."

## Outputs

- `renewals/calendar.md` (live, NOT indexed)
- `renewals/{YYYY-QN}-digest.md` (indexed, digest runs only)
- Appends to `outputs.json` with `type: "renewal-digest"` (digest runs only).

## What I never do

- **Auto-renew or cancel on founder's behalf.** Surface and flag; founder acts.
- **Contact vendors.** Renewal outreach is `draft-vendor-outreach`'s job and still needs founder approval.
- **Skip unparsed contract in connected drive.** If found, surface ("3 contracts not yet parsed — run `extract-contract-clauses` on: {list}") rather than silently ignore.