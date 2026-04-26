---
name: score-a-linkedin-profile-0-100-against-the-role
description: "Scrapes a LinkedIn or public-profile URL via Firecrawl and scores 0-100 across level-fit, domain-fit, scope, tenure, and culture-signal. Writes to candidates/{slug}.md."
version: 1
tags: ["people", "overview-action", "evaluate-candidate"]
category: "Hiring"
featured: yes
integrations: ["googlesheets", "googledrive", "linkedin", "firecrawl"]
image: "busts-in-silhouette"
inputs:
  - name: role
    label: "Role"
  - name: linkedin_url
    label: "Linkedin URL"
  - name: candidate_slug
    label: "Candidate Slug"
    required: false
prompt_template: |
  Score this LinkedIn profile for the {{role}} role: {{linkedin_url}}. Use the evaluate-candidate skill with source=linkedin. Scrape the profile via Firecrawl, score 0-100 across 4-6 sub-criteria with one-line reasons citing profile evidence, and list 3-5 red flags to probe in interviews. Write to candidates/{{candidate_slug}}.md.
---


# Score a LinkedIn profile 0-100 against the role
**Use when:** Sub-scores with evidence cited + red flags.
**What it does:** Scrapes a LinkedIn or public-profile URL via Firecrawl and scores 0-100 across level-fit, domain-fit, scope, tenure, and culture-signal. Writes to candidates/{slug}.md.
**Outcome:** Candidate record at candidates/{slug}.md with total + sub-scores + red flags.
## Instructions
Run this as a user-facing action. Use the underlying `evaluate-candidate` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Score this LinkedIn profile for the {role} role: {LinkedIn URL}. Use the evaluate-candidate skill with source=linkedin. Scrape the profile via Firecrawl, score 0-100 across 4-6 sub-criteria with one-line reasons citing profile evidence, and list 3-5 red flags to probe in interviews. Write to candidates/{candidate-slug}.md.
```
