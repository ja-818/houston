---
name: prep-me-before-my-1-1-with-employee
description: "Aggregates HRIS profile (read-only) plus local onboarding plans, check-ins, and interview-loop history into one page. Profile / history / recent signals / upcoming."
version: 1
tags: ["people", "overview-action", "employee-dossier"]
category: "Onboarding"
featured: yes
integrations: ["notion", "slack", "loops"]
image: "busts-in-silhouette"
---


# Prep me before my 1:1 with {employee}
**Use when:** HRIS profile + onboarding + check-ins + loop history.
**What it does:** Aggregates HRIS profile (read-only) plus local onboarding plans, check-ins, and interview-loop history into one page. Profile / history / recent signals / upcoming.
**Outcome:** Dossier at employee-dossiers/{slug}.md  -  read 2 minutes before the 1:1.
## Instructions
Run this as a user-facing action. Use the underlying `employee-dossier` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Prep me for my 1:1 with {employee}. Use the employee-dossier skill. Pull HRIS profile from my connected HRIS (read-only), plus onboarding-plans/, recent checkins/, and interview-loops/ into a single-page dossier at employee-dossiers/{employee-slug}.md: profile / history / recent signals / upcoming.
```
