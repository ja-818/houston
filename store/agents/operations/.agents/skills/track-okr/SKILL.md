---
name: track-okr
description: "Use when ask OKR status ('how doing on OKRs' / 'refresh OKRs' / 'which KRs off-track')  -  refresh each KR current value via any Composio-connected OKR tool (Notion, Airtable, Google Sheets), append snapshots to `okr-history.json`, classify on-track / at-risk / off-track, surface root causes from linked decisions + priorities."
version: 1
tags: [operations, track, okr]
category: Operations
featured: yes
image: clipboard
integrations: [googlesheets, notion, airtable, linear, linkedin]
---


# Track OKR

## When to use

- User ask OKR status, want refresh, or ask "what off-track."
- Weekly / quarterly cadence  -  if last snapshot in
  `okr-history.json` older than 10 days.
- Start of new quarter  -  rebaseline.
- Pulled implicitly by `prep-board-pack` and `draft-investor-update`
  when latest snapshot stale.

## Steps

1. **Read `context/operations-context.md`.** If
   missing or empty, stop and ask you run Head of
   Operations' `define-operating-context` first. Active priorities
   drive "likely root cause" attribution for off-track KRs.

2. **Read `config/okrs.json`.** If missing or empty, ask ONE
   targeted question: *"No OKRs yet  -  best: if OKR tool
   connected via Composio, point me at it and pull current state.
   Otherwise paste or drop OKR doc.
   If no OKRs yet, fine  -  say so and help
   draft starter set."* Write and continue.

3. **For each objective, refresh each KR current value.** In
   order of preference:
   - **Connected OKR tool via Composio**  -  `composio search okr`
     (or category user named during onboarding). Pull
     latest `current` per KR.
   - **metric-tracking handoff**  -  if KR maps to tracked metric
     in this agent, cite query slug and read
     latest value from `metrics-daily.json`. Keeps
     numbers consistent across agents.
   - **Ask owner**  -  if neither available, tell you
     which owners to ping and stop short of inventing numbers.

4. **Snapshot to `okr-history.json`.** Append one record per
   objective (or per-KR if owner updates KR-scoped) with
   `{ objectiveId, date, keyResults: [{ id, value, state }], state,
   createdAt }`. Date today (YYYY-MM-DD).

5. **Classify each KR against target.** Pull expected
   attainment curve from KR record (`linear` default unless
   user declared front-/back-loaded during onboarding or
   prior refresh). For today's point in period:
   - `on-track`  -  `current / target` ≥ `expected-for-this-point`.
   - `at-risk`  -  within 20 percentage points of expected but below.
   - `off-track`  -  more than 20 percentage points below expected.

   20-pp threshold = documented default; user can override
   per-KR in `config/okrs.json`.

6. **Roll KR states up to objective state.** If any KR
   `off-track`, objective `off-track`. If any `at-risk` and
   none `off-track`, objective `at-risk`. Else `on-track`.
   Update `config/okrs.json` with new state + fresh `current`
   values.

7. **Attach reason codes from linked decisions.** For each at-risk
   / off-track KR:
   - Scan `decisions.json` for decisions where
     `linkedInitiativeSlugs` includes same slug KR references
     (if any)  -  recent pending decision on linked initiative =
     likely cause.
   - Check operating-context priorities  -  if KR tied to
     inactive priority, surface that.
   - Record reason in KR `reason` field in
     `config/okrs.json`.

8. **Report in chat.**

   ```
   OKR refresh  -  {YYYY-MM-DD}

   On-track: {N}  |  At-risk: {N}  |  Off-track: {N}

   Off-track:
   - {objective}  -  {KR}: {current}/{target} {unit} ({% attained}).
     Likely cause: {linked decision slug or priority note}.

   At-risk:
   - ...

   (Full history in `okr-history.json`.)
   ```

9. **Hand-off hint.** If anything flipped to off-track this cycle,
   offer: "Want me run `identify-bottleneck` to see if pattern
   cross-OKR? Or hand off-track KR to Head of
   Operations to nudge owner?"

10. **Append to `outputs.json`** with `type: "okr-snapshot"`,
    status "ready".

## Outputs

- Appended `okr-history.json`
- Updated `config/okrs.json` (fresh current values + state per
  objective + per-KR reason for at-risk / off-track)
- Appends to `outputs.json` with `type: "okr-snapshot"`.

## What I never do

- **Invent KR value**  -  if no source available, stop and
  tell you which owners to ping.
- **Hardcode at-risk threshold**  -  20-pp = documented
  default; per-KR overrides live in `config/okrs.json`.
- **Modify OKR definitions silently**  -  if user adds new
  objective via chat, confirm shape before writing.