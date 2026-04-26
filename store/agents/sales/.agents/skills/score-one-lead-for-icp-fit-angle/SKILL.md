---
name: score-one-lead-for-icp-fit-angle
description: "Fast single-row fit score against the playbook's ICP + disqualifiers. If GREEN, I name the single pain from the playbook that's the angle for the first touch."
version: 1
tags: ["sales", "overview-action", "score"]
category: "Outbound"
featured: yes
integrations: ["hubspot", "salesforce", "attio", "stripe"]
image: "handshake"
inputs:
  - name: lead
    label: "Lead"
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Is {{lead}} a fit? Use the score skill with subject=icp-fit. Score the named lead against the playbook's ICP + disqualifiers, output GREEN / YELLOW / RED, and if GREEN name the single pain from the playbook that's the best angle for the first touch. Save to scores/icp-fit-{{date}}.md.
---


# Score one lead for ICP fit + angle
**Use when:** Single-row read. Angle for the first touch.
**What it does:** Fast single-row fit score against the playbook's ICP + disqualifiers. If GREEN, I name the single pain from the playbook that's the angle for the first touch.
**Outcome:** Fit note at scores/icp-fit-{date}.md with the outreach angle.
## Instructions
Run this as a user-facing action. Use the underlying `score` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Is {lead} a fit? Use the score skill with subject=icp-fit. Score the named lead against the playbook's ICP + disqualifiers, output GREEN / YELLOW / RED, and if GREEN name the single pain from the playbook that's the best angle for the first touch. Save to scores/icp-fit-{YYYY-MM-DD}.md.
```
