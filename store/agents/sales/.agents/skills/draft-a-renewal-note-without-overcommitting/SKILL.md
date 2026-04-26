---
name: draft-a-renewal-note-without-overcommitting
description: "Renewal draft bundling outcomes shipped (with numbers) + expansion levers + pricing reasoning - stays inside your playbook's pricing stance. Never commits a number outside policy."
version: 1
tags: ["sales", "overview-action", "draft-outreach"]
category: "Retention"
featured: yes
integrations: ["googlecalendar", "gmail", "outlook", "hubspot", "salesforce", "attio", "pipedrive", "gong", "fireflies", "stripe"]
image: "handshake"
inputs:
  - name: customer
    label: "Customer"
  - name: slug
    label: "Slug"
    required: false
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Draft the renewal note for {{customer}}. Use the draft-outreach skill with stage=renewal. Read customers/{{slug}}/ history (onboarding plan, QBRs, health scores). Bundle outcomes shipped (with numbers) + expansion levers + pricing reasoning (from playbook  -  never commit outside the pricing stance). End with a dated next step. Save to customers/{{slug}}/renewal-{{date}}.md.
---


# Draft a renewal note without overcommitting
**Use when:** Outcomes · expansion · pricing  -  stays inside policy.
**What it does:** Renewal draft bundling outcomes shipped (with numbers) + expansion levers + pricing reasoning  -  stays inside your playbook's pricing stance. Never commits a number outside policy.
**Outcome:** Renewal at customers/{slug}/renewal-{date}.md.
## Instructions
Run this as a user-facing action. Use the underlying `draft-outreach` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft the renewal note for {customer}. Use the draft-outreach skill with stage=renewal. Read customers/{slug}/ history (onboarding plan, QBRs, health scores). Bundle outcomes shipped (with numbers) + expansion levers + pricing reasoning (from playbook  -  never commit outside the pricing stance). End with a dated next step. Save to customers/{slug}/renewal-{YYYY-MM-DD}.md.
```
