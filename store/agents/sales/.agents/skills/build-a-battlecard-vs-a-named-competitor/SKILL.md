---
name: build-a-battlecard-vs-a-named-competitor
description: "Per-prospect card (not a generic matrix): 3-criterion grid anchored in what this prospect cares about, 3 trap-set questions, 3 honest rebuttals, 2 proof points from your anchor accounts."
version: 1
tags: ["sales", "overview-action", "build-battlecard"]
category: "Meetings"
featured: yes
integrations: ["notion", "reddit", "firecrawl"]
image: "handshake"
inputs:
  - name: company
    label: "Company"
    placeholder: "e.g. Acme"
  - name: competitor
    label: "Competitor"
  - name: prospect
    label: "Prospect"
prompt_template: |
  Build a battlecard for {{company}} vs {{competitor}}. Use the build-battlecard skill. Research the competitor (positioning, pricing shape, known weaknesses, recent reviews) via Firecrawl + Exa. Build the 3-criterion comparison grid anchored in what Acme actually cares about (pulled from deal notes), 3 trap-set questions, 3 objection rebuttals, 2 proof points from the playbook's anchor accounts. Save to battlecards/{{competitor}}-{{prospect}}.md.
---


# Build a battlecard vs a named competitor
**Use when:** Per-prospect. Grid · trap-Qs · rebuttals · proof.
**What it does:** Per-prospect card (not a generic matrix): 3-criterion grid anchored in what this prospect cares about, 3 trap-set questions, 3 honest rebuttals, 2 proof points from your anchor accounts.
**Outcome:** Battlecard at battlecards/{competitor}-{prospect}.md.
## Instructions
Run this as a user-facing action. Use the underlying `build-battlecard` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Build a battlecard for {Acme} vs {competitor}. Use the build-battlecard skill. Research the competitor (positioning, pricing shape, known weaknesses, recent reviews) via Firecrawl + Exa. Build the 3-criterion comparison grid anchored in what Acme actually cares about (pulled from deal notes), 3 trap-set questions, 3 objection rebuttals, 2 proof points from the playbook's anchor accounts. Save to battlecards/{competitor}-{prospect}.md.
```
