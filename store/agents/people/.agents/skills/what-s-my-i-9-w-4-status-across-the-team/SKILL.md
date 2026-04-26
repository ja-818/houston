---
name: what-s-my-i-9-w-4-status-across-the-team
description: "Scans your HRIS for I-9 / W-4 completeness, missing docs, and next-90-day expirations. Flags go into compliance-calendar.md and outputs.json."
version: 1
tags: ["people", "overview-action", "compliance-calendar"]
category: "Compliance"
featured: yes
integrations: ["googlesheets", "notion"]
image: "busts-in-silhouette"
inputs:
  - name: request
    label: "Additional context"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Audit I-9 / W-4 status across the team. Use the compliance-calendar skill. Scan my connected HRIS for any missing documents, expirations in the next 90 days, and incomplete fields. Update compliance-calendar.md in place and log each flag in outputs.json as a compliance-update entry.

  Additional context: {{request}}
---


# What's my I-9 / W-4 status across the team?
**Use when:** Missing docs, expirations, next-90-day renewals.
**What it does:** Scans your HRIS for I-9 / W-4 completeness, missing docs, and next-90-day expirations. Flags go into compliance-calendar.md and outputs.json.
**Outcome:** Flagged items at compliance-calendar.md. Fix before they block a hire or a renewal.
## Instructions
Run this as a user-facing action. Use the underlying `compliance-calendar` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Audit I-9 / W-4 status across the team. Use the compliance-calendar skill. Scan my connected HRIS for any missing documents, expirations in the next 90 days, and incomplete fields. Update compliance-calendar.md in place and log each flag in outputs.json as a compliance-update entry.
```
