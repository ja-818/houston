---
name: draft-30-60-90-pre-renewal-outreach
description: "3-touch sequence (Day-90 value recap, Day-60 expansion or mechanics, Day-30 direct ask + agenda). Every reference grounded in `timelines/{slug}.md` - no marketer-speak."
version: 1
tags: ["support", "overview-action", "draft-lifecycle-message"]
category: "Success"
featured: yes
integrations: ["hubspot", "attio", "stripe", "mailchimp", "customerio", "loops"]
image: "headphone"
inputs:
  - name: account
    label: "Account"
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Draft pre-renewal outreach for {{account}}. Use the draft-lifecycle-message skill with type=renewal. Chain customer-view view=timeline first for wins + asks-shipped + friction. Draft Day-90 (value recap), Day-60 (expansion opportunity), Day-30 (direct ask + agenda). Every reference grounded in the timeline. Save to renewals/{{account}}-{{date}}.md.
---


# Draft 30/60/90 pre-renewal outreach
**Use when:** Value recap → expansion angle → direct ask.
**What it does:** 3-touch sequence (Day-90 value recap, Day-60 expansion or mechanics, Day-30 direct ask + agenda). Every reference grounded in `timelines/{slug}.md`  -  no marketer-speak.
**Outcome:** Sequence at `renewals/{account}-{date}.md`. Send when you're ready.
## Instructions
Run this as a user-facing action. Use the underlying `draft-lifecycle-message` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft pre-renewal outreach for {account}. Use the draft-lifecycle-message skill with type=renewal. Chain customer-view view=timeline first for wins + asks-shipped + friction. Draft Day-90 (value recap), Day-60 (expansion opportunity), Day-30 (direct ask + agenda). Every reference grounded in the timeline. Save to renewals/{account}-{YYYY-MM-DD}.md.
```
