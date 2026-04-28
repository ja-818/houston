---
name: check-data-quality-on-a-table
description: "Read-only DQ checks on target tables: nulls per column, duplicates on natural keys, freshness, referential integrity, cardinality drift."
version: 1
tags: ["operations", "overview-action", "analyze"]
category: "Data"
featured: yes
integrations: ["airtable", "firecrawl", "fireflies", "gmail", "gong", "googlecalendar", "googledocs", "googledrive", "googlesheets", "linear", "linkedin", "notion", "outlook", "perplexityai", "slack", "stripe"]
image: "clipboard"
---


# Check data quality on a table
**Use when:** Nulls, duplicates, freshness, referential integrity.
**What it does:** Read-only DQ checks on target tables: nulls per column, duplicates on natural keys, freshness, referential integrity, cardinality drift.
**Outcome:** Report at data-quality-reports/{date}/report.md.
## Instructions
Run this as a user-facing action. Use the underlying `analyze` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Run data QA on {table}. Use the analyze skill with subject=data-qa. Read-only checks: nulls per column, duplicates on natural key, freshness (MAX(updated_at) vs expected staleness), referential integrity on key joins, cardinality surprises. Save to data-quality-reports/{YYYY-MM-DD}/report.md with pass / warn / fail per check and a suggested fix per fail.
```
