---
name: tighten-existing-copy-without-losing-intent
description: "I tighten existing copy in your voice: cut adjectives, remove marketer-speak, add specificity, fix rhythm. Preserves intent."
version: 1
tags: ["marketing", "overview-action", "edit-copy"]
category: "Copy"
featured: yes
integrations: ["ahrefs", "airtable", "attio", "customerio", "firecrawl", "fireflies", "gong", "googleads", "googledocs", "hubspot", "instagram", "linkedin", "mailchimp", "metaads", "notion", "perplexityai", "reddit", "salesforce", "semrush", "stripe", "twitter", "youtube"]
image: "megaphone"
inputs:
  - name: slug
    label: "Slug"
    required: false
prompt_template: |
  Edit this copy. Use the edit-copy skill. Tighten in my voice: cut adjectives, remove marketer-speak, add specificity, fix rhythm. Preserve intent. Save an edited version to copy-edits/{{slug}}.md with before/after notes.
---


# Tighten existing copy without losing intent
**Use when:** Cut adjectives, remove marketer-speak, fix rhythm.
**What it does:** I tighten existing copy in your voice: cut adjectives, remove marketer-speak, add specificity, fix rhythm. Preserves intent.
**Outcome:** Edited version at copy-edits/{slug}.md with before/after notes.
## Instructions
Run this as a user-facing action. Use the underlying `edit-copy` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Edit this copy. Use the edit-copy skill. Tighten in my voice: cut adjectives, remove marketer-speak, add specificity, fix rhythm. Preserve intent. Save an edited version to copy-edits/{slug}.md with before/after notes.
```
