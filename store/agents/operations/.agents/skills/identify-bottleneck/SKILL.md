---
name: identify-bottleneck
description: "Use when you say 'what's stuck' / 'what's blocking progress' / 'where are we losing time'  -  I cluster evidence from recent reviews, pending decisions, open anomalies, and off-track OKRs into named bottlenecks, each with a hypothesis and proposed owner. Appends to `bottlenecks.json`."
version: 1
tags: [operations, identify, bottleneck]
category: Operations
featured: yes
image: clipboard
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Identify Bottleneck

## When to use

- User asks "what's stuck," "what's blocking progress," "why aren't we moving on X."
- Most recent weekly review (from this agent) repeats risk or ask from prior one.
- OKR flipped to off-track and linked initiative also slipped.

## Steps

1. **Read `context/operations-context.md`.** If missing or empty, stop and ask user run Head of Operations' `define-operating-context` first. Priorities and key-contacts anchor "proposed owner to unblock" logic.

2. **Gather evidence from last 4 weeks** (handle each source as "if present, use it; if missing, continue"):
   - `reviews/`  -  last 4 weekly review files. Look for repeating risks / asks.
   - `triage/`  -  last 4 inbox-triage files. Recurring "can-wait" threads from same person hint at delegation bottleneck.
   - `decisions.json`  -  any decision with `status: "pending"` older than 14 days → decision-latency bottleneck.
   - `okr-history.json`  -  any KR `off-track` across two or more consecutive snapshots → bottleneck candidate tied to linked initiative.
   - this agent `anomalies.json`  -  repeating open anomalies hint at data-or-process bottleneck.

3. **Cluster recurring themes.** Group evidence by shared owner, shared cross-team dependency, or shared OKR. Bottleneck = cluster, not individual incident.

4. **For each cluster, form hypothesis** (1-2 sentences, never stated as certain):
   - "Hiring in engineering bottlenecked on founder's interview calendar  -  3 initiatives waiting on same reviewer."
   - "Pricing changes blocked on pending decision from week of {date}  -  2 launches staged behind it."
   - "Cross-agent data pulls duplicating work  -  both board pack and investor update asking for same retention query."

5. **Propose owner to unblock.** Read leadership / key contacts section of operating context. For cross-team bottlenecks, owner = whoever owns blocking resource (e.g. CTO for engineering-calendar constraint), not downstream exec. For solo founder, owner = founder  -  proposed unblock usually "carve time for {X}" or "delegate {Y}".

6. **Quantify impact.** List `impactOnOkrIds` (objectives blocked) and `impactOnInitiativeSlugs` (initiatives stalled). Keep citations tight  -  evidence strings reference real paths (review files, decision slugs, anomaly ids).

7. **Dedupe against open bottlenecks.** Read `bottlenecks.json`. If cluster matches existing open row (same proposed owner + overlapping impact set), update in place (add new evidence, refine hypothesis, refresh `updatedAt`). Do NOT create duplicate.

8. **Sensitive-matter routing.** If hypothesis names specific person as bottleneck (performance / capacity), do NOT land that language in `bottlenecks.json`. Generalize to role-and-process language ("engineering interview capacity") in index row. Flag specifics to CEO in chat only.

9. **Write new / updated bottlenecks** to `bottlenecks.json` (atomic). Each row: `{ slug, title, hypothesis, proposedOwner, impactOnOkrIds, impactOnInitiativeSlugs, status: "open", evidence, createdAt, updatedAt }`.

10. **Append to `outputs.json`** with `type: "bottleneck"`, status "ready" per new row.

11. **Hand off in chat.**

    ```
    {N} bottleneck(s) identified.

    1. **{title}**  -  proposed owner: {owner}.
       Hypothesis: {hypothesis}
       Blocks: {N} OKR(s), {M} initiative(s).
       Evidence: {citations}

    2. ...

    Want me to draft a nudge to {proposed owner} for #1?
    (I'd hand that off to the `draft-reply` skill.)
    ```

## Outputs

- Appended / updated `bottlenecks.json`
- Appends to `outputs.json` with `type: "bottleneck"` per new row.

## What I never do

- **Name person as bottleneck** in indexed JSON  -  generalize to role/process, flag specifics privately.
- **State hypothesis as certain**  -  "likely" / "pattern suggests" only.
- **Draft nudge message here**  -  hands off to Head of Operations' `draft-reply` (inbox voice-matched drafts).