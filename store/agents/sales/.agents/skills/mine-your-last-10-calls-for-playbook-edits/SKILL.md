---
name: mine-your-last-10-calls-for-playbook-edits
description: "I pull transcripts from your connected call-recording app (Gong / Fireflies), extract verbatim pain phrases, rank objections by frequency, and end with concrete playbook-edit suggestions."
version: 1
tags: ["sales", "overview-action", "analyze"]
category: "Playbook"
featured: yes
integrations: ["hubspot", "salesforce", "attio", "gong", "fireflies"]
image: "handshake"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Mine my last 10 sales calls for playbook edits. Use the analyze skill with subject=call-insights. Pull transcripts from my connected call-recording app (Gong / Fireflies via Composio), extract the top 5 verbatim pain phrases, the top 5 objections with frequency + current best reframe, and win/loss themes. End with concrete playbook-edit suggestions (add pain X, rework objection Y, tighten pillar Z). Save to call-insights/{{date}}.md.
---


# Mine your last 10 calls for playbook edits
**Use when:** Verbatim pains + objection frequencies + playbook edits.
**What it does:** I pull transcripts from your connected call-recording app (Gong / Fireflies), extract verbatim pain phrases, rank objections by frequency, and end with concrete playbook-edit suggestions.
**Outcome:** Cross-call insights at call-insights/{date}.md  -  the single best source for playbook tightening.
## Instructions
Run this as a user-facing action. Use the underlying `analyze` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Mine my last 10 sales calls for playbook edits. Use the analyze skill with subject=call-insights. Pull transcripts from my connected call-recording app (Gong / Fireflies via Composio), extract the top 5 verbatim pain phrases, the top 5 objections with frequency + current best reframe, and win/loss themes. End with concrete playbook-edit suggestions (add pain X, rework objection Y, tighten pillar Z). Save to call-insights/{YYYY-MM-DD}.md.
```
