---
name: 10-headline-variants-grounded-in-real-quotes
description: "10 headline + subhead pairs, each grounded in a verbatim customer quote, review line, or positioning-doc claim. No marketer-speak. Top 3 ranked to test first."
version: 1
tags: ["marketing", "overview-action", "write-headline-variants"]
category: "Copy"
featured: yes
integrations: ["reddit", "firecrawl"]
image: "megaphone"
inputs:
  - name: page
    label: "Page"
  - name: page_slug
    label: "Page Slug"
    required: false
prompt_template: |
  Give me 10 headlines for {{page}}. Use the write-headline-variants skill. Each headline + subhead pair grounded in a verbatim customer quote, review line, or positioning-doc claim. No marketer-speak. Top 3 ranked to test first. Save to headline-variants/{{page_slug}}.md.
---


# 10 headline variants grounded in real quotes
**Use when:** Each cites the customer quote behind it.
**What it does:** 10 headline + subhead pairs, each grounded in a verbatim customer quote, review line, or positioning-doc claim. No marketer-speak. Top 3 ranked to test first.
**Outcome:** Variants at headline-variants/{page}.md.
## Instructions
Run this as a user-facing action. Use the underlying `write-headline-variants` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Give me 10 headlines for {page}. Use the write-headline-variants skill. Each headline + subhead pair grounded in a verbatim customer quote, review line, or positioning-doc claim. No marketer-speak. Top 3 ranked to test first. Save to headline-variants/{page-slug}.md.
```
