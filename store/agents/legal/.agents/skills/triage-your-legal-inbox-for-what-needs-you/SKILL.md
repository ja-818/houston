---
name: triage-your-legal-inbox-for-what-needs-you
description: "Sweeps your connected Gmail / Outlook for legal-flavored inbound, classifies each item (NDA / MSA / DPA / DSR / subpoena / TM / contractor), recommends a route. Read-only - never replies."
version: 1
tags: ["legal", "overview-action", "triage-legal-inbox"]
category: "Contracts"
featured: yes
integrations: ["gmail", "outlook"]
image: "scroll"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Sweep my legal inbox from the last 7 days. Use the triage-legal-inbox skill. Read my connected Gmail / Outlook for legal-flavored inbound, classify each item (NDA green/yellow/red, MSA, DPA, DSR, subpoena, TM office action, contractor, other), recommend a route per item. Save to intake-summaries/{{date}}.md.
---


# Triage your legal inbox for what needs you
**Use when:** Classifies NDAs, MSAs, DPAs, DSRs. Recommends routes.
**What it does:** Sweeps your connected Gmail / Outlook for legal-flavored inbound, classifies each item (NDA / MSA / DPA / DSR / subpoena / TM / contractor), recommends a route. Read-only  -  never replies.
**Outcome:** Triage summary at intake-summaries/{date}.md with routes per item.
## Instructions
Run this as a user-facing action. Use the underlying `triage-legal-inbox` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Sweep my legal inbox from the last 7 days. Use the triage-legal-inbox skill. Read my connected Gmail / Outlook for legal-flavored inbound, classify each item (NDA green/yellow/red, MSA, DPA, DSR, subpoena, TM office action, contractor, other), recommend a route per item. Save to intake-summaries/{YYYY-MM-DD}.md.
```
