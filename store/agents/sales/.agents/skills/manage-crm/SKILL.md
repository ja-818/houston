---
name: manage-crm
description: "Use when you say 'sweep CRM hygiene' / 'what's my pipeline by stage' / 'route new inbounds' / 'queue a task for {deal}'  -  I run the `action` you pick on your connected CRM (HubSpot / Salesforce / Attio / Pipedrive / Close): `clean` (detect dupes + missing fields + stage mismatches · diff list awaits per-row approval) · `query` (natural-language → read-only answer + the query I ran) · `route` (GREEN → assign, YELLOW → nurture, RED → drop) · `queue-followup` (push a task into Linear / Notion / Asana-style). Writes to `crm-reports/{action}-{date}.md`."
version: 1
tags: [sales, manage, crm]
category: Sales
featured: yes
image: handshake
integrations: [hubspot, salesforce, attio, pipedrive, notion, linear]
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Manage CRM

One skill, four CRM actions. `action` param pick op. "Read-first, mutate-only-with-approval" shared.

## Parameter: `action`

- `clean`  -  hygiene sweep: dupes, missing required fields, stage mismatches (e.g. deal Stage 3, no champion captured). Write diff list. Mutate only on explicit per-row approval.
- `query`  -  natural-language question → read-only CRM query → answer + query ran. "How many deals in Stage 2?" / "Show deals closing this month." / "Who owns Acme?"
- `route`  -  read latest lead scores, apply playbook routing policy (default: GREEN → assign owner, YELLOW → nurture queue, RED → drop). Write decisions; mutate CRM owner fields only on approval.
- `queue-followup`  -  push task to connected task tool (Linear / Notion / Asana-style). Task content: who, what, when, linked deal / lead.

User ask imply action ("clean up CRM", "what's my pipeline", "route leads", "queue followup") → infer. Else ask ONE question naming 4 options.

## When to use

- Explicit triggers in description.
- Implicit: after `score subject=lead` done, chain `action=route`. After `analyze subject=discovery-call` or `draft-outreach stage=followup`, chain `action=queue-followup` for next step.

## Ledger fields I read

Read `config/context-ledger.json` first.

- `domains.crm.slug`  -  required all actions. Ask ONE question if missing: "Which CRM  -  HubSpot, Salesforce, Attio, Pipedrive, Close? Open Integrations to connect."
- `domains.crm.dealStages` + `ownerMap`  -  `clean` + `route` use them.
- `domains.crm.leadRouting`  -  routing policy (default "green-ae-yellow-sdr-red-drop").
- `playbook`  -  from `context/sales-context.md`. Required for `clean` (stage-exit-criteria drive stage-mismatch detect) and `route` (ICP ground RED drop).

## Steps

1. **Read ledger + playbook.** Gather missing required fields (ONE question each, best-modality first). Write atomic.

2. **Discover CRM slug via Composio.** `composio search crm` → pick connected. None → name category to link and stop.

3. **Branch on action.**
   - `clean`:
     1. Pull full contact + deal list via CRM read tools.
     2. Detect issues:
        - **Dupes**  -  contacts matching email domain + last name + first-name fuzzy; deals same account + overlapping amount.
        - **Missing required fields**  -  per playbook qualification framework (e.g. Stage-3 deal, no champion captured).
        - **Stage mismatches**  -  deal Stage N but Stage N-1 exit criteria not met; stale deals (no activity >30 days, active stages).
     3. Write diff list to `crm-reports/clean-{YYYY-MM-DD}.md`  -  one section per issue type, each row with **recommended mutation** + approve command (per row, not blanket). Nothing mutated yet.
     4. Show top 10 issues inline + path. Wait explicit per-row approval before execute mutations via `composio <crm> <action>`.
   - `query`:
     1. Parse question into structured query (entity + filters + grouping).
     2. Run query read-only via connected CRM.
     3. Return answer + query ran (user adjust). Save to `crm-reports/query-{YYYY-MM-DD}.md` with question, query, answer table. No mutate.
   - `route`:
     1. Read latest `scores/lead-*.md` (or run `score subject=lead` first if stale) and `leads.json`.
     2. Apply routing policy:
        - **GREEN** → assign default owner from `ownerMap` (ask once if missing).
        - **YELLOW** → nurture queue (surface for `draft-outreach stage=cold-email` later).
        - **RED** → drop (disqualifier cited).
     3. Write decisions to `crm-reports/route-{YYYY-MM-DD}.md`. Show top 10 inline + counts per bucket. Wait approval before mutate CRM owner fields.
   - `queue-followup`:
     1. Parse ask: who, what, when. Pull deal / lead reference if named.
     2. Discover task tool via `composio search task`. None → ask once which to use.
     3. Push task via tool's create-task slug. Capture task URL.
     4. Log to `tasks/{YYYY-MM-DD}.md` (append  -  running log, not per-task file).

4. **Append to `outputs.json`**  -  read-merge-write atomic: `{ id (uuid v4), type: "crm-sweep" (clean) | "crm-query" (query) | "routing-decision" (route) | "task-queued" (queue-followup), title, summary, path, status: "ready" (or "draft" for clean / route until mutations approved), createdAt, updatedAt, domain: "crm" }`.

5. **Summarize to user.** Top finding + next required approval (clean / route) or confirmation (query / queue-followup). Never mutate without explicit per-row approval.

## What I never do

- Mutate CRM records (stage change, owner reassign, contact delete) without explicit per-row approval.
- Invent CRM field or deal  -  every row cites real record ID from connected CRM.
- Query outside read-only scope user authorized.
- Push task to unconnected tool  -  always discover via Composio.

## Outputs

- `clean` → `crm-reports/clean-{YYYY-MM-DD}.md`
- `query` → `crm-reports/query-{YYYY-MM-DD}.md`
- `route` → `crm-reports/route-{YYYY-MM-DD}.md`
- `queue-followup` → append to `tasks/{YYYY-MM-DD}.md`
- Append to `outputs.json`.