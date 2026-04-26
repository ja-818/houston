---
name: schedule-meeting
description: "Use when you say 'book a meeting with {X}' / 'find 30 min with {team}' / 'let's schedule {Y}'  -  I propose 3 times that respect your focus blocks and max-meetings-per-day, draft the counterparty message in your voice, iterate, and create the event in Google Calendar only after your explicit approval."
version: 1
tags: [operations, schedule, meeting]
category: Operations
featured: yes
image: clipboard
integrations: [googlecalendar, gmail, outlook]
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Schedule Meeting

## When to use

- "book a meeting with {X}" / "find 30 min with {team}".
- "let's schedule {Y}" / "propose times for {Z}".
- Handoff from `triage-inbox` skill when thread classified as `schedule-meeting` and you say "book it."

## Steps

1. **Read `context/operations-context.md`.** If missing/empty, stop. Ask you to run Head of Operations' `define-operating-context` first. Voice, priorities, key-contacts shape draft.

2. **Clarify ask.** Extract from message: counterparty name(s), duration (default 30 min), purpose, timezone (default user's). If material missing, ask ONE question.

3. **Read `config/schedule-preferences.json` and `config/vips.json`.** If preferences missing, ask ONE question (best: connect calendar so I infer) and continue.

4. **Resolve calendar.** `composio search calendar` → free/busy + create-event slugs. No calendar connected → tell user which category to link, stop.

5. **Fetch free/busy.** Pull busy blocks next 10 business days. Compute candidate slots that:
   - fall inside `workingHours`,
   - do NOT intersect any `focusBlock`,
   - respect `minBufferMinutes` on both sides of existing busy,
   - keep day's total meetings ≤ `maxMeetingsPerDay`,
   - avoid `blackoutPeriods`.

   Thresholds from config  -  do NOT hardcode.

6. **Pick 3 options.** Spread across days (e.g. tomorrow AM, day-after PM, end-of-week AM). Prefer mid-morning (10–11:30) and early afternoon (2–4). Avoid Mondays before noon, Friday afternoons unless nothing else fits. VIPs → prefer morning slots, bigger buffers.

7. **Draft message.** Read `config/voice.md` (or voice block in operating context). Voice samples missing → ask ONE targeted question (best: connect inbox via Composio for 20–30 recent sent messages calibration) and continue. Pattern: one-line ack → 3 proposed times (bulleted, both user + counterparty timezones labeled if different) → soft fallback ("or suggest a time that works better"). Cap ~80 words.

8. **Write `scheduling/{slug}/proposal.md`** (slug = kebab-cased counterparty or thread id  -  prefix `sched-` if standalone). Overwrite per iteration. Structure:

   ```markdown
   ## Counterparty
   {name} <{email}>

   ## Proposed times
   - {Day Mon DD, H:MMam PT / H:MMpm ET}  -  {duration}
   - ...

   ## Constraints honored
   - focus blocks respected: {list}
   - daily meeting cap: {X}/{max}
   - buffers: {min} min

   ## Draft message
   {the drafted body}

   ## Status
   draft
   ```

9. **Present to user.** "Here 3 options + draft message. Send? Tweak? Add 4th?" Never send.

10. **Iterate on reply.** Counterparty reply picks slot or counter-proposes → update proposal `## Status` (draft → sent → counter-proposed). Confirm or loop back step 5–6 with narrowed window.

11. **Book on approval.** You say "book {time} with {counterparty}" → call Composio create-event slug. Add counterparty as attendee, include video link if provider supports, title per user instruction or inferred purpose. Update proposal status `confirmed`.

12. **Append to `outputs.json`** with `type: "scheduling"`, status "draft" until confirmed, flip to "ready" on booking.

13. **Hand off prep.** After booking, if attendee VIP or meeting high-stakes, offer: "Want me run `prep-meeting-briefing` on this one now?"

## Outputs

- `scheduling/{slug}/proposal.md` (overwritten per iteration)
- Created calendar event on approval
- Appends to `outputs.json` with `type: "scheduling"`.

## What I never do

- **Book** calendar event without your explicit "book it" on specific time.
- **Send** counterparty message  -  draft only. User sends from own inbox, or approves me to send via Composio after review.
- **Override focus block or daily cap** without user explicitly waiving for this one meeting.
- **Propose slots without reading preferences**  -  `schedule-preferences.json` missing → ask once, continue.