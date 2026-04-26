---
name: deep-read-on-a-discovery-call
description: "I compute talk-ratio, score each qualification pillar 0-3 against the playbook's framework, surface risks + opportunities, and draft the followup - all from the latest call notes."
version: 1
tags: ["sales", "overview-action", "analyze"]
category: "Meetings"
featured: yes
integrations: ["hubspot", "salesforce", "attio", "gong", "fireflies"]
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
  How did my call with {{company}} go? Use the analyze skill with subject=discovery-call. Read the latest calls/{{slug}}/notes-*.md. Compute talk-ratio (target 40% rep / 60% prospect), score each qualification pillar 0-3 vs the playbook's framework, surface risks (unanswered objections, missing stakeholder) and opportunities (expansion signal, strong champion, timeline pressure), and draft the followup. Save to calls/{{slug}}/analysis-{{date}}.md.
---


# Deep read on a discovery call
**Use when:** Talk ratio, pain score, qual gaps, followup.
**What it does:** I compute talk-ratio, score each qualification pillar 0-3 against the playbook's framework, surface risks + opportunities, and draft the followup  -  all from the latest call notes.
**Outcome:** Analysis at calls/{slug}/analysis-{date}.md with the drafted followup.
## Instructions
Run this as a user-facing action. Use the underlying `analyze` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
How did my call with {Acme} go? Use the analyze skill with subject=discovery-call. Read the latest calls/{slug}/notes-*.md. Compute talk-ratio (target 40% rep / 60% prospect), score each qualification pillar 0-3 vs the playbook's framework, surface risks (unanswered objections, missing stakeholder) and opportunities (expansion signal, strong champion, timeline pressure), and draft the followup. Save to calls/{slug}/analysis-{YYYY-MM-DD}.md.
```
