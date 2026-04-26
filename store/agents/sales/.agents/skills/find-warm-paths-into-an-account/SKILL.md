---
name: find-warm-paths-into-an-account
description: "I search your connected LinkedIn and CRM for first-degree connections at the target - ranked Strong / Medium / Weak - and draft the intro ask per strong path."
version: 1
tags: ["sales", "overview-action", "research-account"]
category: "Outbound"
featured: yes
integrations: ["gmail", "hubspot", "salesforce", "attio", "linkedin", "firecrawl", "perplexityai"]
image: "handshake"
inputs:
  - name: company
    label: "Company"
    placeholder: "e.g. Acme"
  - name: slug
    label: "Slug"
    required: false
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Find warm-paths into {{company}}. Use the research-account skill with depth=warm-paths. Search my connected LinkedIn + CRM for first-degree connections and mutual-customer paths. Rank Strong / Medium / Weak. Draft the intro ask per strong path. Save to leads/{{slug}}/warm-paths-{{date}}.md.
---


# Find warm-paths into an account
**Use when:** First-degree intros from LinkedIn + CRM.
**What it does:** I search your connected LinkedIn and CRM for first-degree connections at the target  -  ranked Strong / Medium / Weak  -  and draft the intro ask per strong path.
**Outcome:** Warm-paths at leads/{slug}/warm-paths-{date}.md with drafted intro asks.
## Instructions
Run this as a user-facing action. Use the underlying `research-account` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Find warm-paths into {Acme}. Use the research-account skill with depth=warm-paths. Search my connected LinkedIn + CRM for first-degree connections and mutual-customer paths. Rank Strong / Medium / Weak. Draft the intro ask per strong path. Save to leads/{slug}/warm-paths-{YYYY-MM-DD}.md.
```
