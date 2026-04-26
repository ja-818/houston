---
name: spec-event-tracking-a-utm-matrix
description: "Event names, triggers, properties, and owner per step. Plus a UTM matrix so paid / social / email are comparable in GA4 / your analytics."
version: 1
tags: ["marketing", "overview-action", "setup-tracking"]
category: "Paid"
featured: yes
integrations: ["linkedin", "reddit"]
image: "megaphone"
inputs:
  - name: slug
    label: "Slug"
    required: false
prompt_template: |
  Spec the event tracking plan for sign-up → activation. Use the setup-tracking skill. Event names, triggers, properties, owner per step. UTM matrix so paid / social / email are comparable in my connected GA4 / PostHog. Save to tracking-plans/{{slug}}.md.
---


# Spec event tracking + a UTM matrix
**Use when:** Events, properties, UTM rules  -  hand to engineering.
**What it does:** Event names, triggers, properties, and owner per step. Plus a UTM matrix so paid / social / email are comparable in GA4 / your analytics.
**Outcome:** Plan at tracking-plans/{slug}.md  -  hand to engineering.
## Instructions
Run this as a user-facing action. Use the underlying `setup-tracking` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Spec the event tracking plan for sign-up → activation. Use the setup-tracking skill. Event names, triggers, properties, owner per step. UTM matrix so paid / social / email are comparable in my connected GA4 / PostHog. Save to tracking-plans/{slug}.md.
```
