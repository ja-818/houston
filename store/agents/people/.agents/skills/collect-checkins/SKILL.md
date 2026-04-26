---
name: collect-checkins
description: "Use when you say 'collect this week's check-ins' / '1:1 status across the team' / 'who's been quiet'  -  pulls the roster from your connected HRIS, sends the check-in prompt to each member via your connected Slack channel, collects responses, and writes a dated report at `checkins/{YYYY-MM-DD}.md` with themes plus who's quiet plus flagged responses."
version: 1
tags: [people, collect, checkins]
category: People
featured: yes
image: busts-in-silhouette
integrations: [slack, discord]
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Collect Check-ins

## When to use

- Explicit: "collect this week's check-ins", "1:1 status across the team", "who's been quiet", "run the weekly check-in".
- Implicit: called by analyze skill with subject=people-health to pull fresh check-in state before Monday readout.
- Frequency: typically matches `config/context-ledger.json` (check-in rhythm) cadence (weekly / biweekly / monthly). Safe ad-hoc.

## Steps

1. **Read people-context doc:** `context/people-context.md`. If missing or empty, tell user: "I need the people-context doc first  -  run the define-people-context skill." Stop.
2. **Read config:** `config/context-ledger.json`. If either missing, ask ONE targeted question naming best modality ("Is your HRIS connected  -  I can pull roster directly  -  or should I take pasted list?"). Write to config, continue.
3. **Resolve roster.** If `source: "connected-hris"`, run `composio search hris` to discover tool slug and execute roster-fetch action. If pasted, use `members[]` from `config/context-ledger.json` (roster).
4. **Resolve check-in prompt.** Use `defaultPrompt` from `config/context-ledger.json` (check-in rhythm) if set; otherwise read check-in-prompt section of `context/people-context.md`; otherwise fall back to neutral default ("1. Wins this week. 2. Blockers or frustrations. 3. Anything you want me to know.").
5. **Send prompt.** Run `composio search chat` to discover chat tool slug and send prompt per configured channel (channel post, DM-per-person, or email). If no chat connection exists, tell user which category to link from Integrations tab and stop.
6. **Collect responses** over configured window. Read replies from same channel / thread / DM. If responses not retrievable programmatically, ask user to paste thread export.
7. **Summarize.** Per member: responded / not-responded, pull themes into three buckets  -  wins · blockers · concerns. Flag members with 2+ consecutive missed cycles as "quiet". Flag any response whose wording triggers escalation-rules section of `context/people-context.md` (e.g. harassment, discrimination, wage dispute)  -  these escalate to founder, never summarized in public view.
8. **Write** to `checkins/{YYYY-MM-DD}.md` atomically (`*.tmp` → rename). Structure: Response rate → Quiet members → Themes (wins · blockers · concerns) → Escalation-flagged responses (founder-eyes-only note, not response body) → Recommended next actions.
9. **Append to `outputs.json`**  -  read existing array, add `{ id, type: "checkin", title, summary, path, status: "ready", createdAt, updatedAt }`, write atomically.
10. **Summarize to user**  -  one paragraph with response rate, quiet-member count, top themes, path to full report. If any response escalation-flagged, say so and recommend founder review directly  -  do not summarize content.

## Never invent

Never fabricate check-in response or theme. If member didn't respond, mark "quiet"  -  do not imagine what they would have said. If responses sparse, surface honestly.

## Outputs

- `checkins/{YYYY-MM-DD}.md`
- Appends to `outputs.json` with type `checkin`.