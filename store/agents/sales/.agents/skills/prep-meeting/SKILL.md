---
name: prep-meeting
description: "Use when you say 'prep me for my {discovery / demo} with {Acme}' / 'prep the QBR for {customer}'  -  I prep the `type` you pick: `call` (pre-call one-pager: goal · attendees · question bank prioritized on the weakest qualification pillar · objections · exit criteria · landmines) · `qbr` (QBR pack: outcomes shipped with numbers · usage trend via PostHog · open asks · risks · next-quarter goal · renewal runway). Writes to `deals/{slug}/call-prep-{date}.md` or `customers/{slug}/qbr-{YYYY-QN}.md`."
version: 1
tags: [sales, prep, meeting]
category: Sales
featured: yes
image: handshake
integrations: [googlecalendar, hubspot, salesforce, attio, gong, fireflies, stripe, linkedin]
---


# Prep Meeting

One skill, two meeting-prep shapes. `type` param pick structure. Playbook-grounding + "no generic templates" shared.

## Parameter: `type`

- `call`  -  pre-call one-pager (discovery / demo / followup / late-stage). Goal · attendees · questions · objections · exit criteria.
- `qbr`  -  Quarterly Business Review pack for existing customer. Outcomes · usage trend · open asks · risks · next-quarter goal.

User ask names type plain English ("call prep", "QBR") → infer. Else ask ONE question naming 2 options.

## When to use

- Explicit triggers in description.
- Implicit: `daily-brief` detect imminent meeting no prep, chain here for `type=call`; customer-retention routine chain here for `type=qbr` before renewal window.

## Ledger fields I read

Read `config/context-ledger.json` first.

- `playbook`  -  from `context/sales-context.md`. Required. `type=call` need qualification framework + deal stages + objection handbook + primary first-call goal. `type=qbr` need success-metric definition + renewal pricing stance.
- `domains.crm.slug`  -  deal / customer record. Ask ONE question if missing.
- `domains.meetings.callRecorder`  -  pull prior call transcripts for `type=call`.
- `domains.retention.productUsage`  -  `type=qbr` usage trend.

## Steps

1. **Read ledger + playbook.** Gather missing required fields (ONE question each, best-modality first). Write atomically.

2. **Branch on type.**
   - `call`:
     1. Read deal row `deals.json` + prior call notes `calls/{slug}/`. Read account brief `accounts/{slug}/brief-*.md` (chain `research-account depth=full-brief` if missing + user approves).
     2. Pull meeting details Google Calendar (via Composio) if meeting time specified. Capture attendees (title + role, enrich via LinkedIn if thin).
     3. Compile one-pager:
        - **Meeting goal**  -  from playbook primary first-call goal, adjust for stage (discovery / demo / late-stage).
        - **Attendees**  -  name, title, 1-line profile + likely motivation this meeting.
        - **Context recap**  -  2-3 bullets from account brief + prior call analysis.
        - **Question bank**  -  5-8 questions from playbook qualification framework. Prioritize weakest pillar on current deal state (reference prior call analyses if exist).
        - **Likely objections**  -  top 2 from playbook objection handbook + current best reframe per.
        - **Exit criteria**  -  what must be true at call-end for deal advance stage (from playbook deal-stages + exit-criteria section).
        - **Landmines to avoid**  -  anything from `call-insights/*.md` flagged loss pattern for segment.
     4. Save `deals/{slug}/call-prep-{YYYY-MM-DD}.md` (atomic `*.tmp` → rename). Create `deals/{slug}/` if missing.
     5. Update `deals.json` row  -  set `lastCallPrepAt`.
   - `qbr`:
     1. Read customer row `customers.json` + prior QBR (`customers/{slug}/qbr-*.md`) to make this update, not rewrite.
     2. Pull usage trend via PostHog / Mixpanel / Amplitude (if connected). Pull billing state via Stripe. Pull open support tickets if ticket tool connected.
     3. Compile QBR pack:
        - **Outcomes shipped**  -  against success metric locked at kickoff (from `customers/{slug}/onboarding-plan.md` if exists). Show numbers.
        - **Usage trend**  -  quarter-over-quarter. Cite metric source.
        - **Open asks**  -  open feature requests + support escalations.
        - **Risks**  -  yellow/red drivers from latest `score subject=customer-health` run.
        - **Next-quarter goal**  -  one concrete outcome, tied to product roadmap if visible.
        - **Renewal runway**  -  days to renewal + pricing stance reminder (from playbook).
     4. Save `customers/{slug}/qbr-{YYYY-QN}.md`.
     5. Update `customers.json` row  -  set `lastQbrAt`.

3. **Append to `outputs.json`**  -  read-merge-write atomically: `{ id (uuid v4), type: "call-prep" (for call) | "qbr-prep" (for qbr), title, summary: "<meeting goal | top risk + top outcome>", path, status: "ready", createdAt, updatedAt, domain: "<meetings | retention>" }`.

4. **Summarize to user.** Meeting goal (or top outcome for qbr) + top 3 questions (or top risk for qbr) inline. Path to full prep.

## What I never do

- Invent attendees, usage numbers, prior-call facts. Every row cite source.
- Ship generic discovery-call template  -  every question bank prioritized against deal current qualification state.
- Write QBR as dashboard  -  narrative with 3 risks + 3 wins, not graph.

## Outputs

- `call` → `deals/{slug}/call-prep-{YYYY-MM-DD}.md`; updates `deals.json`.
- `qbr` → `customers/{slug}/qbr-{YYYY-QN}.md`; updates `customers.json`.
- Append `outputs.json`.