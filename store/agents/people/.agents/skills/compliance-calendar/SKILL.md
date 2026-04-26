---
name: compliance-calendar
description: "Use when you say 'build the compliance calendar' / 'what's coming up in HR compliance' / 'what I-9 / W-4 / visa renewals are due'  -  scans your connected HRIS plus the review-cycle rhythm and visa statuses, produces a living calendar at `compliance-calendar.md`, and logs each substantive update to `outputs.json`."
version: 1
tags: [people, compliance, calendar]
category: People
featured: yes
image: busts-in-silhouette
integrations: [googlesheets, notion]
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Compliance Calendar

## When to use

- Explicit: "build the compliance calendar", "what's coming up in HR compliance", "what I-9 / W-4 / visa renewals are due", "refresh the compliance calendar".
- Implicit: routed monthly, or new hire finishes onboarding (new I-9 deadline), or visa date recorded.
- Frequency: on-demand + monthly refresh.

## Steps

1. **Read people-context doc.** Read `context/people-context.md` for review-cycle rhythm (annual / semi-annual / quarterly, next cycle date) + any policy-refresh cadence. If missing/empty, tell user: "I need the people-context doc first  -  run the define-people-context skill." Stop.
2. **Read ledger.** `config/context-ledger.json` (HRIS read-only  -  never modify records). If HRIS not connected, ask ONE targeted question with modality hint ("Connect your HRIS  -  Gusto, Deel, Rippling, or Justworks  -  in the Integrations tab so I can pull start dates, work-authorization status, and vesting schedules").
3. **Discover tools via Composio.** Run `composio search hris` for read-only profile slug + `composio search calendar` for calendar tool to push reminders if user wants.
4. **Scan employee records (read-only).** Per employee, pull:
   - Start date (I-9 3-day rule reference).
   - W-4 last-refreshed date.
   - Work-authorization / visa expiration (if applicable).
   - Equity vesting start + cliff date + acceleration terms (if applicable).
   - Review-cycle anchor date vs rhythm in people-context.
5. **Produce calendar entries per category:**
   - **I-9 deadlines**  -  3-day rule. Flag anyone still in 3-day window.
   - **W-4 refresh timing**  -  annual refresh anchors.
   - **Visa expirations**  -  90 / 60 / 30 day warnings per employee.
   - **State registration requirements**  -  per-state obligations from new-state hires.
   - **Review-cycle dates**  -  derived from rhythm in people-context.
   - **Equity vesting cliffs**  -  notify 30 days pre-cliff.
   - **PTO policy refresh dates**  -  annual / fiscal refresh.
6. **Update living doc.** Write full refreshed calendar atomically to `compliance-calendar.md` at agent root (NOT subfolder)  -  write `compliance-calendar.md.tmp`, rename over existing file. Structure: one section per category above, entries sorted by date ascending, each entry carrying `{ employee-slug (if applicable), due-date, days-out, action }`. Top-of-file "Refreshed: {timestamp}" line.
7. **Append to `outputs.json`**  -  read existing array, add new entry per refresh: `{ id, type: "compliance", title: "Compliance calendar refresh {YYYY-MM-DD}", summary, path: "compliance-calendar.md", status: "ready", createdAt, updatedAt }`. Each substantive refresh = NEW outputs.json entry  -  file at agent root overwritten, but outputs log append-only so dashboard shows history. Write atomically.
8. **Summarize to user**  -  one paragraph: count of entries per category, nearest-term action, path to `compliance-calendar.md`. Offer to push date reminders to connected calendar tool.

## Never invent

Every entry ties back to real HRIS record or real people-context anchor. Field missing → mark TBD. Don't guess date.

## Never mutate

HRIS / payroll records read-only from this agent. Skill reads, scans, produces markdown calendar  -  never writes back to HRIS.

## Outputs

- `compliance-calendar.md` at agent root (living doc, updated atomically in place).
- Appends to `outputs.json` with type `compliance` per refresh  -  dashboard shows refresh history even though calendar file overwritten.