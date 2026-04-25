---
name: triage
description: "Use when you say 'triage my inbox' / 'scan my calendar' / 'find conflicts' / 'what's in my email' — I classify and rank what needs you. Pick `surface`: `inbox` sorts last-24h email into needs-me-today / can-wait / ignore with a specific action per thread · `calendar` scans the next 7 days for overbooks, missing buffers, unprotected VIP slots, and meetings without prep. Writes to `triage/` or `calendar-scans/`."
integrations:
  inbox: [gmail, outlook]
  calendar: [googlecalendar]
---

# Triage

Classify + rank two surfaces eat week: inbox, calendar. Never draft replies (that `draft-message`), never edit events (that `schedule-meeting`).

## When to use

- `surface=inbox` — "triage my inbox" / "what's in my email" / "summarize my inbox" / "inbox roundup".
- `surface=calendar` — "scan my calendar" / "find conflicts" / "how's my week" / "rebalance my week".

## Ledger fields I read

- `universal.positioning` — confirms `context/operations-context.md` exist (know priorities + key contacts + hard nos).
- `domains.people.vips` — who get top-bucket (inbox), unprotected-slot alerts (calendar).
- `domains.rhythm.focusBlocks` — calendar overlap detect.
- `domains.rhythm.maxMeetingsPerDay` — calendar overload threshold.
- `domains.rhythm.timezone` — read calendar windows right.

Required field missing: ask ONE targeted question with modality hint (connected app > file > URL > paste), write to ledger, continue.

## Parameter: `surface`

- `inbox` — classify last-24h (or custom window) threads into `needs-me-today` / `can-wait` / `ignore`, rank top bucket by time-sensitivity, state verb+object action per thread. Writes `triage/{YYYY-MM-DD}.md`.
- `calendar` — scan next 7 days for overbooks, missing buffers, focus-block clashes, unprotected VIP slots, meetings without prep. Writes `calendar-scans/{YYYY-MM-DD}.md` + upserts `calendar-conflicts.json`.

## Steps

1. Read `config/context-ledger.json`. Fill gaps with ONE targeted question.
2. Read `context/operations-context.md`. Missing: stop, ask me run `define-operating-context` first — no invent priorities.
3. Branch on `surface`:

   **If `surface = inbox`:**
   - Pull threads via connected inbox (Gmail / Outlook via Composio). Default window: last 24 hours. Include sender, subject, first 200 chars of latest message, whether reply to something I sent.
   - Classify each thread:
     - `needs-me-today` — someone waiting on me, decision due before EOD, or sender in Key Contacts.
     - `can-wait` — legit but not urgent. Note default deferral ("wait for their follow-up" / "batch Friday" / "hand to `draft-message type=reply`").
     - `ignore` — newsletters, cold outreach, receipts, automated notifications.
   - Rank `needs-me-today` bucket: irreversible-if-missed > customer-in-distress > investor-pending > everything else.
   - Per thread, write verb + object action ("reply with pricing page", "forward to Vendor Ops for renewal decision", "decline — not our ICP", "delegate to {contact}"). Never "review."

   **If `surface = calendar`:**
   - Pull next 7 days via connected calendar (`googlecalendar` / `outlook`). Include attendees, descriptions, durations, start/end in your timezone.
   - Flag each conflict class: overbook (2 events same time), no-buffer (back-to-back with <5 min), focus-block clash (meeting inside declared focus block), unprotected VIP slot (VIP time with no prep event or empty description), unprepped meeting (external attendees + no agenda in description + no prior brief in `meetings/`).
   - Rank by severity (overbook > VIP-unprotected > focus-clash > no-buffer > unprepped).

4. Write atomically (`.tmp` then rename). Second same-day pass becomes `{date}-{HH}.md`.
5. Append to `outputs.json` with `{id, type, title, summary, path, status, createdAt, updatedAt, domain: "people"}`. Type = `"triage"` (inbox) or `"calendar-scan"` (calendar).
6. Summarize to you: bucket counts + top action (inbox), or worst conflict + fix (calendar).

## Outputs

- `triage/{YYYY-MM-DD}.md` (inbox)
- `calendar-scans/{YYYY-MM-DD}.md` + upserts `calendar-conflicts.json` (calendar)
- Appends to `outputs.json`.

## What I never do

- Draft, send, archive, label, star, mark-as-read anything — read-only. Draft = `draft-message`.
- Create, move, cancel calendar events — that `schedule-meeting`.
- Invent urgency — thread state unclear: surface in `needs-me-today` with question for you, no fabricate deadline.