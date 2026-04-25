---
name: capture-call-notes
description: "Use when you paste a transcript, drop a recording, or say 'process my call with {lead}' — I pull the transcript from your connected Gong or Fireflies (or accept paste / file), then extract structured notes: agenda actual-vs-intended, attendees, pains verbatim, decisions, action items, next step. Writes to `calls/{slug}/notes-{YYYY-MM-DD}.md`."
---

# Capture Call Notes

Turn raw transcript into structured, queryable, CRM-ready notes.

## When to use

- User: "process my call with Acme" / pastes transcript / drops
  `.txt` or `.vtt` file / "capture notes from yesterday's meeting".
- Called by routine pulling from connected meeting-notes app
  (Fathom, Fireflies, Grain, Circleback, etc. — discovered via
  `composio search meeting-notes`).

## Steps

1. **Source transcript.** If pasted, use it. If file, read it. If
   user points to connected provider, run `composio search` for
   list/search tool, find most recent meeting matching user's
   description, pull transcript.
2. **Identify meeting.** Extract date/time, attendees (separate
   internal vs external), duration, meeting title if available.
3. **Match to lead.** Find external attendee(s) in `leads.json`
   by name + company. If not found, create minimal lead row from
   transcript, mark `source: "meeting-first-contact"`.
4. **Assign id.** `call_id = kebab(date-primary-external-name)`.
5. **Extract structured notes:**
   - **Agenda actual** — what actually discussed (not what agenda
     said).
   - **Pain points raised** — specific phrases in their words, with
     transcript quote.
   - **Objections raised** — price, timing, authority, fit — quoted.
   - **Decisions** — anything agreed during call.
   - **Action items** — owner + what + by when. Split internal vs
     external.
   - **Next step** — single next scheduled touchpoint (if agreed)
     or "next step TBD."
6. **Write structured:** `calls/{call_id}/notes.json` with full
   schema + `calls/{call_id}/notes.md` as human-readable rollup.
7. **Update lead dossier.** Append to
   `leads/{slug}/lead.json` → `recentCalls: [...]` (id + date +
   one-line summary). Update `lastContactedAt`, `status` (likely
   "meeting-held" or "follow-up-owed").
8. **Add to `calls.json` index** with id, date, lead slug, attendees,
   next-step summary.
9. **CRM sync (if connected).** Run `composio search crm`. If linked,
   upsert meeting/activity record on lead's CRM contact.
   Include attendees + date + action items + next step. Never sync
   verbatim transcript unless user explicitly opts in (usually out
   of scope for CRM notes fields).
10. **Note-app sync (if connected).** If user has connected
    notes/docs app AND `config/notes-sync.json` says push, create
    note there. Otherwise skip silently.
11. **Summarize to user:** "Captured. 3 pain points, 2 action
    items (1 yours: {X}, 1 theirs: {Y}), next step: {Z}. CRM synced."

## Never invent

If field not clearly present in transcript, write "not stated"
— never fill plausible-sounding pain points or owners. Downstream
cost of hallucinated call notes high.

## Outputs

- `calls/{call_id}/notes.json` (structured)
- `calls/{call_id}/notes.md` (human-readable)
- Updates `leads/{slug}/lead.json` and `leads.json`
- Updates `calls.json` index
- Optional: CRM activity upsert
- Optional: notes-app entry