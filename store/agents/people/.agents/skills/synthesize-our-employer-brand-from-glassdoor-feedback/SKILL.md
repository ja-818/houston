---
name: synthesize-our-employer-brand-from-glassdoor-feedback
description: "Clusters reviews + survey + anonymous-feedback items via Firecrawl or connected review sources. Top 3 strengths, top 3 concerns, emerging patterns, contradictions vs your stated values."
version: 1
tags: ["people", "overview-action", "analyze"]
category: "Culture"
featured: yes
integrations: ["hubspot", "github", "linear", "jira", "slack", "discord", "firecrawl"]
image: "busts-in-silhouette"
---


# Synthesize our employer brand from Glassdoor + feedback
**Use when:** Top 3 strengths · top 3 concerns · emerging patterns.
**What it does:** Clusters reviews + survey + anonymous-feedback items via Firecrawl or connected review sources. Top 3 strengths, top 3 concerns, emerging patterns, contradictions vs your stated values.
**Outcome:** Leadership readout at analyses/employer-brand-{date}.md. Route concerns to founder / agent / lawyer.
## Instructions
Run this as a user-facing action. Use the underlying `analyze` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Synthesize our employer brand. Use the analyze skill with subject=employer-brand. Pull reviews from my connected Glassdoor or anonymous-feedback platform via Firecrawl / connected review sources, cluster themes, derive top 3 strengths + top 3 concerns + emerging patterns, flag contradictions vs our stated values, and recommend 3 moves. Write to analyses/employer-brand-{YYYY-MM-DD}.md. Leadership readout only  -  do not publish.
```
