---
name: compliance-check-is-this-vendor-clean
description: "Public-source research via Exa / Perplexity / Firecrawl: frameworks held, named officers, recent incidents, litigation. Every claim cited with source URL."
version: 1
tags: ["operations", "overview-action", "research-compliance"]
category: "Vendors"
featured: yes
integrations: ["linkedin", "firecrawl", "perplexityai"]
image: "clipboard"
---


# Compliance check  -  is this vendor clean?
**Use when:** Frameworks, named officers, incidents. Every claim cited.
**What it does:** Public-source research via Exa / Perplexity / Firecrawl: frameworks held, named officers, recent incidents, litigation. Every claim cited with source URL.
**Outcome:** Report at compliance-reports/{company}.md.
## Instructions
Run this as a user-facing action. Use the underlying `research-compliance` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Run a compliance check on {company}. Use the research-compliance skill. Public-source research via Exa / Perplexity / Firecrawl: frameworks held (SOC 2, ISO 27001, HIPAA, GDPR posture), named officers, recent incidents, litigation. Every claim cited with source URL. Save to compliance-reports/{company-slug}.md.
```
