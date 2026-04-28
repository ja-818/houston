---
name: run-a-full-seo-audit-of-your-site
description: "On-page + technical audit via Semrush (or Ahrefs / Firecrawl fallback). Ranks issues by impact × ease, not severity - a fix list, not a wall of warnings."
version: 1
tags: ["marketing", "overview-action", "audit"]
category: "SEO"
featured: yes
integrations: ["firecrawl", "semrush", "ahrefs", "perplexityai"]
image: "megaphone"
---


# Run a full SEO audit of your site
**Use when:** 10 prioritized fixes  -  impact × ease, no wall of warnings.
**What it does:** On-page + technical audit via Semrush (or Ahrefs / Firecrawl fallback). Ranks issues by impact × ease, not severity  -  a fix list, not a wall of warnings.
**Outcome:** Scored audit at audits/site-seo-{domain}-{date}.md  -  10 prioritized fixes you can ship this week.
## Instructions
Run this as a user-facing action. Use the underlying `audit` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Run a full SEO audit of my site. Use the audit skill with surface=site-seo. Pull on-page + technical via my connected Semrush (or Ahrefs / Firecrawl fallback). Score issues by impact × ease, not severity level. Give me the top 10 prioritized fixes with the exact change each one needs (title tag, schema, internal link, missing alt, etc.). Save to audits/site-seo-{domain}-{YYYY-MM-DD}.md.
```
