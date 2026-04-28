---
name: define-operating-context
description: "Use when you say 'set up our operating context' / 'draft the operating doc' / 'document how we work'  -  I interview you briefly and write `context/operations-context.md` (company overview, priorities, rhythm, key contacts, tools, vendor posture, hard nos, voice). Every other skill in this agent reads it before producing anything substantive."
version: 1
tags: [operations, define, operating]
category: Operations
featured: yes
image: clipboard
---


# Define Operating Context

This agent OWNS `context/operations-context.md`. No other agent writes it. This skill creates or updates it. Its existence unblocks this agent.

## When to use

- "set up our operating context" / "draft the operating doc" / "document how we work".
- "update the operating context" / "priorities changed, fix the doc".
- Called implicitly by other skill needing context doc and finds missing  -  only after confirming with user.

## Steps

1. **Read config.** Load `config/company.json`, `config/rhythm.json`, `config/voice.md`. If any missing, run `onboard-me` first (or ask ONE missing piece just-in-time with best-modality hint: connected app > file > URL > paste).

2. **Read existing doc if present.** If `context/operations-context.md` exists, read so run is update, not rewrite. Preserve anything founder already sharpened; change only stale or new.

3. **Ask for pieces config can't cover.** Before drafting, ask founder concisely for:
   - **Key contacts**  -  names + role + how-to-reach for: lead investor, closest advisor, 1-2 anchor customers, fractional legal/finance, ops contractor (if any).
   - **Vendor posture**  -  risk appetite (conservative / balanced / fast), signature authority (founder only / any exec), term preference (monthly / annual / case-by-case), paper preference (ours / theirs / whatever).
   - **Hard nos**  -  anything founder-specific atop workspace-level four (never move money, never modify HRIS/payroll, never decide procurement alone, never send external without approval).
   - **Connected tools** (by Composio category, not brand)  -  inbox, calendar, team-chat, drive, meeting-recording, CRM (if any), billing (if any), web-research, news, social.

   If section thin, mark `TBD  -  {what founder should bring next}` and move on. Never invent.

4. **Draft doc (~300-500 words, opinionated, direct).** Structure, in order:

   1. **Company overview**  -  one paragraph: what we make, who for, stage, why now.
   2. **Active priorities**  -  2-3 things moving company this quarter. Approval-flow rubric + weekly review key off these.
   3. **Operating rhythm**  -  deep-work days, meeting days, review cadence, no-meeting days, timezone.
   4. **Key contacts**  -  names, roles, how to reach. Organized by category (investors, advisors, anchor customers, contractors, legal).
   5. **Tools & systems**  -  connected Composio categories + where data lives (primary drive, CRM, project tool, chat, billing).
   6. **Vendors & spend posture**  -  risk appetite, signature authority, term preferences, paper preferences.
   7. **Hard nos**  -  workspace-level four + founder-specific.
   8. **Communication voice**  -  4-6 bullets on tone, forbidden phrases, sentence-length preference. Pulled from `config/voice.md`.

5. **Write atomically.** Write to `context/operations-context.md.tmp`, then rename to `context/operations-context.md`. Single file at agent root. NOT under subfolder. NOT under `.agents/`. NOT under `.houston/<agent>/`.

6. **DO NOT append to `outputs.json`.** Doc live; not deliverable, not indexed.

7. **Summarize to user.** One paragraph: what captured, what still `TBD`, exact next move (e.g. "send me your advisor list and I'll tighten Key Contacts"). Remind them Vendor & Procurement Ops agent now has context to run.

## Outputs

- `context/operations-context.md` (at agent root  -  live document)

(No entry in `outputs.json`  -  by design.)