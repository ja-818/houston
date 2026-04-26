---
name: evaluate-a-supplier-against-my-criteria
description: "Rubric-based due-diligence: score 1-10 per criterion, risk tier green / yellow / red, strengths, concerns, first-call questions, and a recommendation."
version: 1
tags: ["operations", "overview-action", "evaluate-supplier"]
category: "Vendors"
featured: yes
integrations: ["airtable", "firecrawl", "fireflies", "gmail", "gong", "googlecalendar", "googledocs", "googledrive", "googlesheets", "linear", "linkedin", "notion", "outlook", "perplexityai", "slack", "stripe"]
image: "clipboard"
inputs:
  - name: supplier
    label: "Supplier"
  - name: supplier_slug
    label: "Supplier Slug"
    required: false
prompt_template: |
  Evaluate {{supplier}} against our criteria. Use the evaluate-supplier skill. Rubric-based due-diligence. Score 1-10 on each criterion, risk tier green / yellow / red, strengths, concerns, first-call questions, and a clear recommendation. Save to evaluations/{{supplier_slug}}.md.
---


# Evaluate a supplier against my criteria
**Use when:** Score 1-10, green/yellow/red, concerns, recommendation.
**What it does:** Rubric-based due-diligence: score 1-10 per criterion, risk tier green / yellow / red, strengths, concerns, first-call questions, and a recommendation.
**Outcome:** Evaluation at evaluations/{supplier}.md.
## Instructions
Run this as a user-facing action. Use the underlying `evaluate-supplier` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Evaluate {supplier} against our criteria. Use the evaluate-supplier skill. Rubric-based due-diligence. Score 1-10 on each criterion, risk tier green / yellow / red, strengths, concerns, first-call questions, and a clear recommendation. Save to evaluations/{supplier-slug}.md.
```
