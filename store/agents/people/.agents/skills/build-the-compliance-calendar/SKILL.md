---
name: build-the-compliance-calendar
description: "Scans your HRIS for I-9 / W-4 / visa renewals, pulls the review-cycle rhythm and policy-refresh cadence from your context doc, produces a living calendar at compliance-calendar.md."
version: 1
tags: ["people", "overview-action", "compliance-calendar"]
category: "Compliance"
featured: yes
integrations: ["googlesheets", "notion"]
image: "busts-in-silhouette"
---


# Build the compliance calendar
**Use when:** I-9 · W-4 · visa renewals · cycle dates · policy refresh.
**What it does:** Scans your HRIS for I-9 / W-4 / visa renewals, pulls the review-cycle rhythm and policy-refresh cadence from your context doc, produces a living calendar at compliance-calendar.md.
**Outcome:** Living calendar at compliance-calendar.md. Open it Monday, close the items due this week.
## Instructions
Run this as a user-facing action. Use the underlying `compliance-calendar` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Build the compliance calendar. Use the compliance-calendar skill. Scan my connected HRIS for start dates, work-authorization status, and vesting schedules. Pull the review-cycle rhythm from context/people-context.md. Write a living calendar at compliance-calendar.md (updated in place, atomic), and log each substantive update to outputs.json.
```
