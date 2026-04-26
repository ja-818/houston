---
name: ask-a-data-question-i-ll-write-the-sql
description: "I translate your question to read-only SQL against your connected warehouse, warn on cost before running, execute, save for reuse, and return the result with caveats."
version: 1
tags: ["operations", "overview-action", "run-sql-query"]
category: "Data"
featured: yes
integrations: ["airtable", "firecrawl", "fireflies", "gmail", "gong", "googlecalendar", "googledocs", "googledrive", "googlesheets", "linear", "linkedin", "notion", "outlook", "perplexityai", "slack", "stripe"]
image: "clipboard"
inputs:
  - name: question
    label: "Question"
  - name: slug
    label: "Slug"
    required: false
prompt_template: |
  Answer this data question: {{question}}. Use the run-sql-query skill. Translate to read-only SQL against my connected warehouse, lazy-introspect any unfamiliar tables into config/schemas.json, warn on cost BEFORE running, execute, save the query for reuse at queries/{{slug}}/, and return the result with caveats + a run timestamp.
---


# Ask a data question  -  I'll write the SQL
**Use when:** Read-only, cost-warned, saved for reuse.
**What it does:** I translate your question to read-only SQL against your connected warehouse, warn on cost before running, execute, save for reuse, and return the result with caveats.
**Outcome:** Result + query saved to queries/{slug}/.
## Instructions
Run this as a user-facing action. Use the underlying `run-sql-query` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Answer this data question: {question}. Use the run-sql-query skill. Translate to read-only SQL against my connected warehouse, lazy-introspect any unfamiliar tables into config/schemas.json, warn on cost BEFORE running, execute, save the query for reuse at queries/{slug}/, and return the result with caveats + a run timestamp.
```
