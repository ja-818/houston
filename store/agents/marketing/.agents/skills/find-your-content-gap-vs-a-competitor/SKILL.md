---
name: find-your-content-gap-vs-a-competitor
description: "I crawl their content via Firecrawl, compare to ours, and rank gaps by search volume × how easily we could take the topic."
version: 1
tags: ["marketing", "overview-action", "analyze"]
category: "SEO"
featured: yes
integrations: ["linkedin", "firecrawl", "semrush"]
image: "megaphone"
inputs:
  - name: competitor
    label: "Competitor"
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Where's our content gap vs {{competitor}}? Use the analyze skill with subject=content-gap. Crawl their content via Firecrawl, compare to ours, and rank gaps by search volume × how easily we could take the topic. Save to analyses/content-gap-{{competitor}}-{{date}}.md with a first-draft brief per gap.
---


# Find your content gap vs a competitor
**Use when:** Gaps ranked by volume × how easily we take them.
**What it does:** I crawl their content via Firecrawl, compare to ours, and rank gaps by search volume × how easily we could take the topic.
**Outcome:** Ranked gap list at analyses/content-gap-{competitor}-{date}.md with a first-draft brief per gap.
## Instructions
Run this as a user-facing action. Use the underlying `analyze` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Where's our content gap vs {competitor}? Use the analyze skill with subject=content-gap. Crawl their content via Firecrawl, compare to ours, and rank gaps by search volume × how easily we could take the topic. Save to analyses/content-gap-{competitor}-{YYYY-MM-DD}.md with a first-draft brief per gap.
```
