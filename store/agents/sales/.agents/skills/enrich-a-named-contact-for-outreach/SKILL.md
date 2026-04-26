---
name: enrich-a-named-contact-for-outreach
description: "I pull firmographics + role context + recent posts / talks for a named person via LinkedIn and your connected CRM - personalization input for the first cold email."
version: 1
tags: ["sales", "overview-action", "research-account"]
category: "Outbound"
featured: yes
integrations: ["gmail", "hubspot", "salesforce", "attio", "linkedin", "firecrawl", "perplexityai"]
image: "handshake"
inputs:
  - name: person
    label: "Person"
  - name: company
    label: "Company"
    placeholder: "e.g. Acme"
  - name: slug
    label: "Slug"
    required: false
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Enrich {{person}} at {{company}}. Use the research-account skill with depth=enrich-contact. Via LinkedIn + my connected CRM, capture title, tenure, prior companies, recent posts / talks / podcasts (6 months), and any trigger signal (new role, speaker, press). Save to leads/{{slug}}/enrichment-{{date}}.md.
---


# Enrich a named contact for outreach
**Use when:** Firmographics + role context + recent signals.
**What it does:** I pull firmographics + role context + recent posts / talks for a named person via LinkedIn and your connected CRM  -  personalization input for the first cold email.
**Outcome:** Enrichment at leads/{slug}/enrichment-{date}.md.
## Instructions
Run this as a user-facing action. Use the underlying `research-account` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Enrich {person} at {company}. Use the research-account skill with depth=enrich-contact. Via LinkedIn + my connected CRM, capture title, tenure, prior companies, recent posts / talks / podcasts (6 months), and any trigger signal (new role, speaker, press). Save to leads/{slug}/enrichment-{YYYY-MM-DD}.md.
```
