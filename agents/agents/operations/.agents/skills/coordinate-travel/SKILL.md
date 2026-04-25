---
name: coordinate-travel
description: "Use when you mention a trip / flights to book / a conference / 'I'm going to {city}' — I read your travel prefs (ask once if missing), assemble a trip summary, draft an itinerary with flight + hotel search criteria, and a destination-adapted packing checklist. Writes drafts; never books without approval."
integrations:
  inbox: [gmail]
  calendar: [googlecalendar]
---

# Coordinate Travel

## When to use

- "I'm going to {city}" / "plan my travel to {X}".
- "flights for {conference}" / "I have a customer visit in {X}".
- "assemble my trip pack".

## Steps

1. **Read `context/operations-context.md`.** If missing/empty, stop. Ask user run Head of Operations' `define-operating-context` first. Key-contacts + priorities anchor "what meetings while there?" section.

2. **Clarify trip.** Extract from message: destination(s), dates (or range), purpose (customer visit / conference / offsite / personal), traveling-with (solo / team). If dates or destination missing + material, ask ONE question.

3. **Read travel prefs.** Read `config/travel-prefs.json`. If missing/empty, ask ONE question: "What are your travel defaults — preferred airline, seat (aisle/window), hotel chain, dietary needs, accessibility?" Write answer to `config/travel-prefs.json`, continue.

4. **Read schedule.** Read `config/schedule-preferences.json` for timezone. Check calendar conflicts over trip window via `composio search calendar` (pull events from depart to return date).

5. **Resolve travel connections.** `composio search travel` → check connected travel providers (flight + hotel search). Note available categories. If none connected, proceed with search criteria only + note user books manually (no hardcoded provider assumption).

6. **Generate trip id** — `{YYYY-MM-DD}-{dest-slug}` (kebab-cased destination, e.g. `2026-05-12-sfo`).

7. **Write `travel/{trip-id}/trip.md`** — summary doc. Structure:

   ```markdown
   # Trip — {destination}, {dates}

   ## Purpose
   {1–2 lines — customer visit / conference / offsite / personal}

   ## Dates
   Depart {YYYY-MM-DD} — Return {YYYY-MM-DD} ({N nights})

   ## Destinations
   - {city}, {country/state} — {nights}

   ## Key meetings while there
   - {date} — {attendee or event} — prep: {ready | missing}
   - ... (pulled from connected calendar for events in the trip window)

   ## Open questions
   - {anything the user should clarify before booking}
   ```

8. **Write `travel/{trip-id}/itinerary.md`.** Structure:

   ```markdown
   ## Flights

   ### Outbound
   - Search criteria: {origin} → {destination}, {date},
     {airline pref}, {seat pref}, {max stops}, {price ceiling if
     mentioned}
   - Candidate options (if a provider is connected): {list}

   ### Return
   - Search criteria: {dest} → {origin}, {date}, {same prefs}
   - Candidate options: {list}

   ## Hotels
   - Search criteria: {chain pref}, {nights}, {neighborhood near
     key meetings}, {price ceiling if mentioned}
   - Candidate options: {list}

   ## Ground transport
   - Airport → hotel → meetings
   - Preferred mode: {ride-share / rental / public}

   ## Pending bookings
   - [ ] Outbound flight
   - [ ] Return flight
   - [ ] Hotel
   - [ ] Ground transport
   ```

9. **Write `travel/{trip-id}/packing.md`** — checklist adapted to destination weather (best guess from destination + dates; note assumption), trip type (formal customer visit vs conference vs offsite — clothing differs), and `config/travel-prefs.json` (dietary, accessibility). Sections: `## Essentials`, `## Work`, `## Clothing`, `## Health & toiletries`, `## Destination-specific`.

10. **Atomic writes** — `*.tmp` → rename per file.

11. **Append to `outputs.json`** with `type: "travel-pack"`, status "draft" until user approves bookings.

12. **Summarize to user.** "Trip pack ready at `travel/{trip-id}/`. Want me to search flight options via {available-provider} once you confirm dates, or are you booking yourself? Also — should I block your calendar during the trip?"

## Outputs

- `travel/{trip-id}/trip.md`
- `travel/{trip-id}/itinerary.md`
- `travel/{trip-id}/packing.md`
- Possibly written `config/travel-prefs.json` on first run
- Appends to `outputs.json` with `type: "travel-pack"`.

## What I never do

- **Book** flights, hotels, ground transport without explicit user approval on specific option.
- **Charge** any card.
- **Commit** to travel dates on your behalf.
- **Invent** destination event not on calendar or named by user.