---
name: analyze
description: "Use when you say 'Monday people review' / 'score retention risk' / 'who's a flight risk' / 'synthesize Glassdoor' / 'what's our employer brand'  -  run `subject` you pick: `people-health` roll up what shipped this week across hiring, onboarding, performance, compliance from `outputs.json` · `retention-risk` fuse check-in, sentiment, tenure, comp signals into GREEN/YELLOW/RED per person · `employer-brand` cluster reviews + survey themes into leadership readout. Writes to `analyses/{subject}-{YYYY-MM-DD}.md`."
version: 1
tags: [people, analyze]
category: People
featured: yes
image: busts-in-silhouette
integrations: [hubspot, github, linear, jira, slack, discord, firecrawl]
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Analyze

Three analyses, one skill  -  same structure (gather → classify → write
to `analyses/`), differ by subject. Pick subject; I pick sources +
output shape.

## When to use

- `subject=people-health`  -  "Monday people review", "weekly people
  readout", "what's happening across HR this week".
- `subject=retention-risk`  -  "score retention risk", "who's a flight
  risk", "check team health", "retention readout".
- `subject=employer-brand`  -  "what's our employer brand", "synthesize
  Glassdoor", "leadership readout on what the team is saying", "review
  pulse".

Chains inline from routines (Monday review surface `people-health`;
after manager change, run `retention-risk`).

## Ledger fields I read

- `universal.company`  -  stage + team size inform lens.
- `universal.icp`  -  skipped; not relevant.
- `domains.people.roster`  -  for retention scoring, need current team
  (HRIS connection preferred; paste fallback).
- `domains.people.hris`  -  connected HRIS slug.
- `domains.people.reviewSources`  -  where pull external reviews /
  surveys / anonymous feedback from (`employer-brand` only).

Missing required field → ask ONE targeted question with modality hint
(Composio connection > file drop > URL > paste), write, continue.

## Parameter: `subject`

- `people-health`  -  roll up everything in `outputs.json` from review
  window (default last 7 days). Group by domain (Hiring, Onboarding,
  Performance, Compliance, Culture). Per domain: what shipped, what
  stale (>7 days as `draft`), gaps. Writes to
  `analyses/people-health-{YYYY-MM-DD}.md`.
- `retention-risk`  -  fuse four signal families per team member
  (engagement from `checkins/`, sentiment from recent check-in tone,
  tenure milestones from HRIS, comp exposure vs bands in
  `context/people-context.md`). Classify GREEN / YELLOW / RED with
  signal combination on every RED. Writes to
  `analyses/retention-risk-{YYYY-MM-DD}.md`. Founder-eyes-only.
- `employer-brand`  -  pull reviews / survey responses / feedback items
  from connected sources (Glassdoor / anonymous-feedback / survey
  platforms), cluster themes, derive top 3 strengths + top 3 concerns
  + emerging patterns, flag contradictions vs stated values. Writes
  to `analyses/employer-brand-{YYYY-MM-DD}.md`. Leadership readout  -
  never publish externally.

## Steps

1. **Read ledger**; fill gaps with one targeted question.
2. **Read `context/people-context.md`.** Review / score / brief framed
   against current values, leveling, comp stance, review-cycle rhythm,
   escalation rules  -  not generic HR benchmarks.
3. **Branch on `subject`:**

   - **If `subject = people-health`:**
     1. Read `outputs.json`. Filter to review window (default 7 days
        by `createdAt` / `updatedAt`; accept "last 2 weeks" or "since
        last cycle" as overrides).
     2. Group entries by `domain`: Hiring, Onboarding, Performance,
        Compliance, Culture.
     3. Per domain: count by `type`, top 3 recent items (title + path
        + status), drafts >7 days old.
     4. Cross-cutting patterns: open-req drift (req in context doc
        with no candidate moves in 2+ weeks), retention reds with no
        stay-conversation follow-up, compliance items due in <14 days
        not closed, review-cycle drift.
     5. Draft (~400-700 words): Window + TL;DR (3-5 bullets) → What
        shipped, per domain → Gaps (severity-ranked) → Cross-cutting
        issues → Top 3 next moves → What to flip to `ready`.

   - **If `subject = retention-risk`:**
     1. Resolve roster via connected HRIS or
        `domains.people.roster`.
     2. Per person, fuse four signal families (mark UNKNOWN when
        source unavailable):
        - **Engagement:** check-in response rate over last 4
          `checkins/`, chat activity delta vs 30-day baseline via
          connected Slack / Discord, PR / commit / ticket cadence via
          GitHub / Linear / Jira for eng ICs.
        - **Sentiment:** check-in response tone drift, cross-team
          mentions, anonymous-feedback mentions if feedback source
          connected.
        - **Tenure milestones:** approaching cliff vesting (month 12
          on 4-yr / 1-yr-cliff  -  confirm from context doc),
          post-promotion honeymoon (90 days), recent manager change.
        - **Comp exposure:** time since last comp review vs cadence;
          gap vs band midpoint (>15% below = flag) if comp bands
          exist.
     3. Classify: RED = 2+ families negative AND tenure or comp
        trigger. YELLOW = 1 family negative OR standalone tenure/comp
        trigger. GREEN = clean. Do NOT publish formula.
     4. Write each RED's signal combination (e.g. "check-in response
        dropped 4/4 → 1/4 over 30 days + 12-month cliff + 14 months
        since last comp review"). Recommend `draft-performance-doc
        type=stay-conversation` for every RED.
     5. Structure: Summary counts → Per-person scores (alphabetical)
        → RED reasoning blocks → Recommended next actions.

   - **If `subject = employer-brand`:**
     1. Discover review sources: `composio search reviews`, `composio
        search survey`, `composio search feedback`. Nothing connected
        → name category to link (reviews, survey, feedback) + stop.
     2. Ask ONE scope question: "Window  -  30, 90, or 365 days?"
        Default 90.
     3. Fetch items per source: date, rating, full text, role /
        tenure if attached.
     4. Cluster verbatim mentions. Each cluster: label, count, 3-5
        verbatim quotes, valence (+/0/-).
     5. Derive top 3 strengths, top 3 concerns, emerging patterns
        (clusters growing in recent window vs earlier).
     6. Compare vs stated values + hard nos in
        `context/people-context.md`. Flag contradictions as items to
        address.
     7. Recommend 3 moves: where to double down, where to close gap,
        which concern routes to human lawyer (discrimination /
        harassment / wage-dispute shapes).
     8. Structure (~500-900 words): Scope → Top strengths → Top
        concerns → Emerging patterns → Contradictions vs values →
        Recommended responses → Routing flags → Sources.

4. **Never invent.** Every cluster, signal, metric ties to fetched
   record. Mark `UNKNOWN` where signal family has no source. For
   `people-health`, never invent activity agent didn't produce.
5. **Write atomically** to per-subject path above (`*.tmp` →
   rename).
6. **Append to `outputs.json`** with:
   ```json
   {
     "id": "<uuid v4>",
     "type": "analysis",
     "title": "<subject>  -  <YYYY-MM-DD>",
     "summary": "<2-3 sentences>",
     "path": "analyses/<subject>-<YYYY-MM-DD>.md",
     "status": "<ready for people-health; draft for retention-risk and employer-brand>",
     "createdAt": "<ISO>",
     "updatedAt": "<ISO>",
     "domain": "<performance for retention-risk, culture for employer-brand, performance for people-health>"
   }
   ```
7. **Summarize.** One paragraph with counts + top finding + path. For
   `retention-risk`, remind: founder-eyes-only, not public channels.
   For `employer-brand`, remind: leadership readout, not external
   publishing.

## Outputs

- `analyses/people-health-{YYYY-MM-DD}.md` (`subject=people-health`).
- `analyses/retention-risk-{YYYY-MM-DD}.md` (`subject=retention-risk`).
- `analyses/employer-brand-{YYYY-MM-DD}.md` (`subject=employer-brand`).
- Appends to `outputs.json`.

## What I never do

- Invent activity, signals, quotes  -  thin sources get UNKNOWN.
- Publish `retention-risk` or `employer-brand` artifacts outside of
  you (optional: forward to named team lead in founder → manager
  chain, never public).
- Recommend counter-offer on retention RED unless
  `context/people-context.md` explicitly allows.