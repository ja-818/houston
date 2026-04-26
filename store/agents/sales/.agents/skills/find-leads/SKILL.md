---
name: find-leads
description: "Use when you say 'find me leads in {segment}' / 'give me 20 in {segment}' / 'surface leads I can reach out to this week'  -  I surface net-new leads from your connected sources or public intent signals (CRM lookalikes, LinkedIn threads, recent-funding feeds, Google Maps for local biz, Reddit / community posts), quick-score against the playbook's disqualifiers, and save GREEN / YELLOW leads with the trigger signal cited. Writes to `leads/batches/{segment-slug}-{YYYY-MM-DD}.md` and `leads.json`."
version: 1
tags: [sales, find, leads]
category: Sales
featured: yes
image: handshake
integrations: [hubspot, salesforce, attio, linkedin, twitter, reddit, firecrawl]
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Find Leads

Surface net-new leads in segment.

## When to use

- "find me {N} leads in {segment}".
- "surface leads I can reach out to this week".
- "compile leads from {LinkedIn post / subreddit / event}".
- Scheduled: weekly prospecting routine.

## Ledger fields I read

Reads `config/context-ledger.json` first.

- `playbook`  -  from `context/sales-context.md`. Required for ICP
  + disqualifiers. If missing: "want me to draft your playbook
  first? (`define-playbook`, ~5m)" and stop.
- `universal.icp`  -  industry, roles, pains, triggers,
  disqualifiers. Used to quick-score candidates.
- `domains.outbound.sources`  -  if missing, ask ONE question naming
  best modality ("Which source  -  your connected CRM for
  lookalikes of closed-won, a LinkedIn post URL, a recent-funding
  feed, Google Maps, or a subreddit?").

## Steps

1. **Read ledger + playbook.** Gather missing required fields
   (ONE question each, best-modality first). Write atomically.

2. **Pick source.** Based on segment + user intent, ask
   which source (unless named):
   - **Connected CRM**  -  expand from lookalike of closed-won.
   - **LinkedIn comment thread**  -  paste post URL; compile
     commenters.
   - **Search engine / funding feed**  -  recent-funding or
     recent-hire signals in segment.
   - **Google Maps**  -  local-biz segments.
   - **Subreddit / community**  -  recent high-engagement posts.

3. **Pull candidates.** Via `composio search <category>` per picked
   source. Cap ~3× requested count for filtering.

4. **Per-candidate quick-score**  -  apply playbook's hard
   disqualifiers. Drop RED. Per surviving candidate, capture:
   - Company + LinkedIn / website URL.
   - Primary contact name + title + LinkedIn (if available).
   - Trigger signal that surfaced them (hiring post, Series B,
     commented on X thread, 4.8-star review  -  cite specifically).
   - Quick fit: GREEN / YELLOW (skip RED  -  dropped).

5. **Write batch file** to `leads/batches/{segment-slug}-{YYYY-
   MM-DD}.md` (atomic `*.tmp` → rename)  -  query, source, date, lead
   list with trigger signals cited.

6. **Append to `leads.json`.** Per surviving candidate, append
   new row with `status: "new"`, `source` (slug of this
   search), `fitScore` (GREEN/YELLOW). No duplicates  -  check
   existing rows by company + name. Read-merge-write atomic.

7. **Append to `outputs.json`:**

   ```json
   {
     "id": "<uuid v4>",
     "type": "lead-batch",
     "title": "Leads  -  {segment}",
     "summary": "<N leads surfaced from {source}. Top signal: {signal}.>",
     "path": "leads/batches/{segment-slug}-{date}.md",
     "status": "ready",
     "createdAt": "<ISO>",
     "updatedAt": "<ISO>",
     "domain": "outbound"
   }
   ```

8. **Summarize to user.** Top 3 leads inline + full file
   path. Suggest: "`research-account depth=enrich-contact` on #1
   next?" or "`score subject=icp-fit` in bulk across these?".

## What I never do

- Invent leads, names, titles, trigger signals. Every lead ties
  to real tool response or URL observation.
- Contact anyone or push leads into CRM without approval.
- Hardcode tool names  -  Composio discovery at runtime only.

## Outputs

- `leads/batches/{segment-slug}-{YYYY-MM-DD}.md`
- Appends to `leads.json` (new rows only).
- Appends to `outputs.json` with `type: "lead-batch"`,
  `domain: "outbound"`.