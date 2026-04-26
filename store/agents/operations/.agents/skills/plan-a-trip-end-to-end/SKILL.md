---
name: plan-a-trip-end-to-end
description: "Trip summary + itinerary draft with flight and hotel criteria + a destination-adapted packing checklist. Drafts only, never books."
version: 1
tags: ["operations", "overview-action", "coordinate-travel"]
category: "Scheduling"
featured: yes
integrations: ["googlecalendar", "gmail"]
image: "clipboard"
inputs:
  - name: city
    label: "City"
  - name: slug
    label: "Slug"
    required: false
prompt_template: |
  Plan my upcoming trip to {{city}}. Use the coordinate-travel skill. Read my travel prefs (ask once if missing). Assemble: trip summary, itinerary draft with flight + hotel search criteria, and a destination-adapted packing checklist. Save to trips/{{slug}}/. Never books  -  drafts only.
---


# Plan a trip end-to-end
**Use when:** Itinerary draft + flight/hotel criteria + packing list.
**What it does:** Trip summary + itinerary draft with flight and hotel criteria + a destination-adapted packing checklist. Drafts only, never books.
**Outcome:** Draft at trips/{slug}/.
## Instructions
Run this as a user-facing action. Use the underlying `coordinate-travel` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Plan my upcoming trip to {city}. Use the coordinate-travel skill. Read my travel prefs (ask once if missing). Assemble: trip summary, itinerary draft with flight + hotel search criteria, and a destination-adapted packing checklist. Save to trips/{slug}/. Never books  -  drafts only.
```
