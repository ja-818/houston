---
name: rigorously-critique-a-landing-page
description: "I fetch the page via Firecrawl and score 6 dimensions 0–3 (headline, value prop, social proof, CTA, objection handling, visual hierarchy). Prioritized fix list, not a generic lecture."
version: 1
tags: ["marketing", "overview-action", "audit"]
category: "Paid"
featured: yes
integrations: ["firecrawl", "semrush", "ahrefs", "perplexityai"]
image: "megaphone"
inputs:
  - name: url
    label: "URL"
    placeholder: "e.g. https://example.com"
  - name: url_slug
    label: "URL Slug"
    required: false
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Critique the landing page at {{url}}. Use the audit skill with surface=landing-page. Fetch the page via Firecrawl and score 6 dimensions 0–3 (headline clarity, value prop, social proof, CTA, objection handling, visual hierarchy). Give me a prioritized fix list  -  not a generic lecture. Save to audits/landing-page-{{url_slug}}-{{date}}.md. For a rewrite, follow up with the write-page-copy skill.
---


# Rigorously critique a landing page
**Use when:** 6 dimensions 0–3, prioritized fix list.
**What it does:** I fetch the page via Firecrawl and score 6 dimensions 0–3 (headline, value prop, social proof, CTA, objection handling, visual hierarchy). Prioritized fix list, not a generic lecture.
**Outcome:** Teardown at audits/landing-page-{url}-{date}.md. Copy the fixes into your tracker.
## Instructions
Run this as a user-facing action. Use the underlying `audit` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Critique the landing page at {url}. Use the audit skill with surface=landing-page. Fetch the page via Firecrawl and score 6 dimensions 0–3 (headline clarity, value prop, social proof, CTA, objection handling, visual hierarchy). Give me a prioritized fix list  -  not a generic lecture. Save to audits/landing-page-{url-slug}-{YYYY-MM-DD}.md. For a rewrite, follow up with the write-page-copy skill.
```
