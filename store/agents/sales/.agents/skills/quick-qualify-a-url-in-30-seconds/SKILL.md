---
name: quick-qualify-a-url-in-30-seconds
description: "30-second read of a single URL via Firecrawl. One decision (IN-ICP / BORDER / OUT) against the playbook's disqualifiers, one angle if IN. For fast triage, not a full brief."
version: 1
tags: ["sales", "overview-action", "research-account"]
category: "Outbound"
featured: yes
integrations: ["gmail", "hubspot", "salesforce", "attio", "linkedin", "firecrawl", "perplexityai"]
image: "handshake"
inputs:
  - name: url
    label: "URL"
    placeholder: "e.g. https://example.com"
  - name: slug
    label: "Slug"
    required: false
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Quick-qualify {{url}}. Use the research-account skill with depth=quick-qualify. One scrape via Firecrawl, one decision (IN-ICP / BORDER / OUT) vs the playbook's disqualifiers, one angle if IN. Save to leads/{{slug}}/qualify-{{date}}.md.
---


# Quick-qualify a URL in 30 seconds
**Use when:** IN-ICP / BORDER / OUT + one angle.
**What it does:** 30-second read of a single URL via Firecrawl. One decision (IN-ICP / BORDER / OUT) against the playbook's disqualifiers, one angle if IN. For fast triage, not a full brief.
**Outcome:** Qualify note at leads/{slug}/qualify-{date}.md.
## Instructions
Run this as a user-facing action. Use the underlying `research-account` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Quick-qualify {url}. Use the research-account skill with depth=quick-qualify. One scrape via Firecrawl, one decision (IN-ICP / BORDER / OUT) vs the playbook's disqualifiers, one angle if IN. Save to leads/{slug}/qualify-{YYYY-MM-DD}.md.
```
