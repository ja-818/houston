---
name: log-an-executed-agreement-to-the-tracker
description: "Appends an executed agreement to counterparty-tracker.json with all the fields the deadline calendar and weekly review need. Computes the notice-must-be-given-by date so auto-renewal never catches you off guard."
version: 1
tags: ["legal", "overview-action", "track-legal-state"]
category: "Entity"
featured: yes
integrations: ["googledrive", "gmail", "notion"]
image: "scroll"
inputs:
  - name: request
    label: "Additional context"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Log this executed agreement. Use the track-legal-state skill with scope=counterparties. Append a row to counterparty-tracker.json with counterparty, agreementType, executedDate, effectiveDate, term, autoRenewal, noticePeriod, governingLaw, keyObligations, signedCopyPath  -  and compute renewalDate = effectiveDate + term - noticePeriod (the 'notice must be given by' date). Ask me for any missing field.

  Additional context: {{request}}
---


# Log an executed agreement to the tracker
**Use when:** Feeds renewal clocks and the Monday roll-up.
**What it does:** Appends an executed agreement to counterparty-tracker.json with all the fields the deadline calendar and weekly review need. Computes the notice-must-be-given-by date so auto-renewal never catches you off guard.
**Outcome:** New row in counterparty-tracker.json with renewal clock computed.
## Instructions
Run this as a user-facing action. Use the underlying `track-legal-state` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Log this executed agreement. Use the track-legal-state skill with scope=counterparties. Append a row to counterparty-tracker.json with counterparty, agreementType, executedDate, effectiveDate, term, autoRenewal, noticePeriod, governingLaw, keyObligations, signedCopyPath  -  and compute renewalDate = effectiveDate + term - noticePeriod (the 'notice must be given by' date). Ask me for any missing field.
```
