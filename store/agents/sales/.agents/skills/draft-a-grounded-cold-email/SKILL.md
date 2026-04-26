---
name: draft-a-grounded-cold-email
description: "Grounded 3-paragraph first-touch email: cited trigger signal → specific pain from the playbook → one-line ask. Voice-matched to your saved samples. Max 110 words."
version: 1
tags: ["sales", "overview-action", "draft-outreach"]
category: "Outbound"
featured: yes
integrations: ["googlecalendar", "gmail", "outlook", "hubspot", "salesforce", "attio", "pipedrive", "gong", "fireflies", "stripe"]
image: "handshake"
inputs:
  - name: person
    label: "Person"
  - name: company
    label: "Company"
    placeholder: "e.g. Acme"
  - name: lead_slug
    label: "Lead Slug"
    required: false
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Draft a cold email to {{person}} at {{company}}. Use the draft-outreach skill with stage=cold-email. Run a fresh signal search (recent news, hires, funding, product launches) via Composio, pick the single strongest signal, and draft 3 short paragraphs: signal → specific pain (from playbook) → one-line ask. Match voice from config/voice.md. Max 110 words body. Save to outreach/email-{{lead_slug}}-{{date}}.md.
---


# Draft a grounded cold email
**Use when:** Trigger signal → specific pain → one-line ask.
**What it does:** Grounded 3-paragraph first-touch email: cited trigger signal → specific pain from the playbook → one-line ask. Voice-matched to your saved samples. Max 110 words.
**Outcome:** Draft at outreach/email-{slug}-{date}.md  -  copy into your inbox when ready.
## Instructions
Run this as a user-facing action. Use the underlying `draft-outreach` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft a cold email to {person} at {Acme}. Use the draft-outreach skill with stage=cold-email. Run a fresh signal search (recent news, hires, funding, product launches) via Composio, pick the single strongest signal, and draft 3 short paragraphs: signal → specific pain (from playbook) → one-line ask. Match voice from config/voice.md. Max 110 words body. Save to outreach/email-{lead-slug}-{YYYY-MM-DD}.md.
```
