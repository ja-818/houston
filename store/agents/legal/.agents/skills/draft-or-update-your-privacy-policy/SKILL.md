---
name: draft-or-update-your-privacy-policy
description: "Scrapes your landing page via Firecrawl, cross-references subprocessor-inventory.json, cites GDPR articles (EU) or CCPA/CPRA (US), includes explicit AI-training disclosure. Produces a sectioned markdown draft."
version: 1
tags: ["legal", "overview-action", "draft-document"]
category: "Compliance"
featured: yes
integrations: ["googledocs", "googledrive", "notion", "firecrawl"]
image: "scroll"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Draft our Privacy Policy. Use the draft-document skill with type=privacy-policy. Scrape my landing page via Firecrawl, cross-reference subprocessor-inventory.json, cite GDPR articles for EU-inclusive geography or CCPA/CPRA for US. AI-training disclosure is explicit. Save to privacy-drafts/privacy-policy-{{date}}.md.
---


# Draft or update your Privacy Policy
**Use when:** Scrapes landing, pulls subprocessors, cites articles.
**What it does:** Scrapes your landing page via Firecrawl, cross-references subprocessor-inventory.json, cites GDPR articles (EU) or CCPA/CPRA (US), includes explicit AI-training disclosure. Produces a sectioned markdown draft.
**Outcome:** Policy draft at privacy-drafts/privacy-policy-{date}.md  -  you publish.
## Instructions
Run this as a user-facing action. Use the underlying `draft-document` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft our Privacy Policy. Use the draft-document skill with type=privacy-policy. Scrape my landing page via Firecrawl, cross-reference subprocessor-inventory.json, cite GDPR articles for EU-inclusive geography or CCPA/CPRA for US. AI-training disclosure is explicit. Save to privacy-drafts/privacy-policy-{YYYY-MM-DD}.md.
```
