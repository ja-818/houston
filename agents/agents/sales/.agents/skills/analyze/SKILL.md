---
name: analyze
description: "Use when you say 'Monday sales review' / 'mine my last calls' / 'run win-loss' / 'how's the pipeline' / 'how did that demo go' — I analyze the `subject` you pick: `sales-health` (weekly roll-up across all domains) · `call-insights` (cross-call synthesis with playbook-edit suggestions via Gong / Fireflies) · `win-loss` (cluster closed deals, propose edits) · `discovery-call` (talk-ratio + qual gaps + drafted followup) · `pipeline` (by-stage snapshot + leakiest transition). Writes to `analyses/{subject}-{YYYY-MM-DD}.md`."
integrations:
  crm: [hubspot, salesforce, attio]
  meetings: [gong, fireflies]
---

# Analyze

One skill, five analysis surfaces. `subject` param picks scope. "Next moves over dashboards" discipline shared.

## Parameter: `subject`

- `sales-health` — Monday readout. Aggregate every skill output across last week from `outputs.json`. Group by domain (Playbook, Outbound, Inbound, Meetings, CRM, Retention). Flag stalled work + missed followups + slippage.
- `call-insights` — cross-N-call synthesis: pain language, objection frequency, win/loss patterns — with concrete playbook-edit suggestions.
- `win-loss` — cluster closed-won + closed-lost deals by reason. Find 3 repeating patterns. Propose playbook edits (ICP tightening, objection handbook additions, pricing adjustments).
- `discovery-call` — single-call deep read: talk-ratio (target 40% rep / 60% prospect), pain score, qual gaps vs playbook framework, risks / opportunities, draft followup.
- `pipeline` — snapshot by stage + ARR + deal velocity + leakiest transition. Anchors weekly forecast.

User ask names subject plain English ("sales review", "mine calls", "win-loss", "how did that call go", "pipeline check") → infer. Else ask ONE question naming 5 options.

## When to use

- Explicit triggers in description.
- Implicit: `capture-call-notes` chains into `analyze subject=discovery-call` to complete post-call loop. Weekly routine "Monday sales review" fires `subject=sales-health`. `run-forecast` chains into `subject=pipeline` for narrative layer.

## Ledger fields I read

Read `config/context-ledger.json` first.

- `playbook` — from `context/sales-context.md`. Required all subjects (qualification framework, deal stages, objection handbook ground every read).
- `domains.meetings.callRecorder` — `discovery-call` + `call-insights` need transcripts. None connected → ask ONE question: "Paste the transcript — or connect Gong / Fireflies via Integrations."
- `domains.crm.slug` + `dealStages` — `win-loss` + `pipeline` need CRM access.

## Steps

1. **Read ledger + playbook.** Gather missing required fields (ONE question each, best-modality first). Write atomically.

2. **Branch on subject.**
   - `sales-health`: read `outputs.json` last 7 days (or user-specified window). Group by domain. Per domain, surface (a) what shipped (titles + paths), (b) what stale (items `status: draft` > 7 days + no `updatedAt` in 3+ weeks), (c) single most useful next move. End **top 3 moves for the week** across domains.
   - `call-insights`: read `calls/*/notes-*.md` + `analysis-*.md` from last N calls (default 10, user override). Extract: top 5 pain phrases (verbatim, frequency-counted), top 5 objections (frequency-counted + current best reframe), win/loss themes (what landed vs stalled). End concrete playbook-edit suggestions: "add pain X to ICP", "rework objection Y handbook entry", "tighten qualification pillar Z". Save to `call-insights/{YYYY-MM-DD}.md`.
   - `win-loss`: pull closed-won + closed-lost deals from CRM (≥5 each recommended; warn if fewer). Cluster by reason. Find 3 patterns. Propose playbook edits. Save to `analyses/win-loss-{YYYY-MM-DD}.md`.
   - `discovery-call`: read latest `calls/{slug}/notes-*.md` (or ask for call id). Compute talk-ratio from transcript if available (speaker labels), else estimate from note density. Score each qualification pillar 0-3 vs playbook framework. Surface risks (unanswered objections, missing stakeholder, stalled pillar) + opportunities (expansion signal, strong champion, timeline pressure). End with drafted followup (hand off to `draft-outreach stage=followup` or draft inline). Save to `calls/{slug}/analysis-{YYYY-MM-DD}.md`.
   - `pipeline`: pull open-deal snapshot from CRM. Per stage: count, ARR, average time-in-stage, stage-to-next-stage conversion. Flag leakiest transition. Compare against last week snapshot if `pipeline-reports/*.md` exists. Save to `analyses/pipeline-{YYYY-MM-DD}.md` + mirror raw table into `pipeline-reports/{YYYY-WNN}.md`.

3. **Write atomically.** Each subject writes to path above with `*.tmp` → rename.

4. **Append to `outputs.json`** — read-merge-write atomically: `{ id (uuid v4), type: "analysis" (or "call-analysis" for discovery-call, "pipeline-report" for pipeline), title: "{Subject} — {date}", summary: "<top finding + top move>", path, status: "ready", createdAt, updatedAt, domain: "<playbook (sales-health, win-loss, call-insights) | meetings (discovery-call) | crm (pipeline)>" }`.

5. **Summarize to user.** One paragraph: single most important finding + top next move. Path to full artifact.

## What I never do

- Invent pipeline numbers, win/loss reasons, call-insight patterns. Every finding ties to real row or transcript passage.
- Ship generic readout — every analysis ends with concrete next move tied to existing skill.
- Roll up across time windows too short to be meaningful (`win-loss` with <3 either side; `call-insights` with <5 calls) — surface warning instead.

## Outputs

- `sales-health`, `win-loss`, `pipeline` → `analyses/{subject}-{date}.md`
- `call-insights` → `call-insights/{YYYY-MM-DD}.md`
- `discovery-call` → `calls/{slug}/analysis-{YYYY-MM-DD}.md`
- `pipeline` also mirrors table to `pipeline-reports/{YYYY-WNN}.md`
- Appends to `outputs.json`.