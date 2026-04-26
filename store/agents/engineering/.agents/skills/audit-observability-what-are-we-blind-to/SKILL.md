---
name: audit-observability-what-are-we-blind-to
description: "I review your connected Sentry / PostHog / Datadog / New Relic / Honeycomb and produce a 3-column matrix (signal × coverage × gap) across errors / traces / logs / alerts / SLOs, plus a top-5 fix list ranked by blast-radius reduction."
version: 1
tags: ["engineering", "overview-action", "audit"]
category: "Reliability"
featured: yes
integrations: ["github", "gitlab", "firecrawl"]
image: "laptop"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Audit my observability. Use the audit skill with surface=observability. Read the connected Sentry / PostHog / Datadog / New Relic / Honeycomb. Produce a 3-column matrix (signal × coverage × gap) across errors / traces / logs / alerts / SLOs. Ground coverage expectations against context/engineering-context.md architecture + invariants. Top 5 fixes ranked by blast-radius reduction. Save to audits/observability-{{date}}.md.
---


# Audit observability  -  what are we blind to?
**Use when:** 3-column matrix + top 5 fixes by blast radius.
**What it does:** I review your connected Sentry / PostHog / Datadog / New Relic / Honeycomb and produce a 3-column matrix (signal × coverage × gap) across errors / traces / logs / alerts / SLOs, plus a top-5 fix list ranked by blast-radius reduction.
**Outcome:** An audit at audits/observability-{date}.md with the blind spots called out.
## Instructions
Run this as a user-facing action. Use the underlying `audit` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Audit my observability. Use the audit skill with surface=observability. Read the connected Sentry / PostHog / Datadog / New Relic / Honeycomb. Produce a 3-column matrix (signal × coverage × gap) across errors / traces / logs / alerts / SLOs. Ground coverage expectations against context/engineering-context.md architecture + invariants. Top 5 fixes ranked by blast-radius reduction. Save to audits/observability-{YYYY-MM-DD}.md.
```
