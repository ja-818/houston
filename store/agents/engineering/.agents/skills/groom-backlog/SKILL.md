---
name: groom-backlog
description: "Use when you say 'groom the backlog' / 'clean up the backlog' / 'what's stale' / 'prune the queue'  -  I pull all open tickets from Linear, Jira, or GitHub Issues and return three review lists (keep-and-prioritize / merge-as-duplicates / close-as-stale), each with one-line rationales. Writes to `backlog-grooming/{YYYY-MM-DD}.md`. Never closes, merges, or reprioritizes tickets in the tracker  -  you review and act."
version: 1
tags: [engineering, groom, backlog]
category: Engineering
featured: yes
image: laptop
integrations: [notion, github, linear, jira]
---


# Groom Backlog

Weekly backlog pass. Three lists. You decide what happen in tracker.

## When to use

- User: "groom the backlog" / "clean up the backlog" / "what's stale" / "prune the queue" / "weekly grooming".
- Recurring weekly rhythm for long-lived backlog.

## Steps

1. **Read engineering context**  -  `context/engineering-context.md`. Missing or empty, say: "I need the engineering context doc first. Run the `define-engineering-context` skill (5 minutes), then come back." Stop.
2. **Read `domains.planning.tracker` from context ledger (`config/context-ledger.json`).** Missing, ask ONE question: "I don't know where your tickets live. Which tracker  -  Linear, Jira, GitHub Issues, ClickUp, Asana, or Notion?" Write ledger atomically, continue.
3. **Read `config/cadence.md`** so week number in output filename match user rhythm. Read any `staleThresholdDays` override in `config/issue-tracker.json`  -  default 90 days no activity if unset.
4. **Fetch open tickets via Composio.** Run `composio search <issue-tracker>` to find list-issues tool slug for connected tracker, then call it. Tracker not connected, stop, tell user which category to link. Per ticket capture: id, title, URL, labels / tags, assignee, createdAt, updatedAt, lastActivityAt (comments + state changes), priority field, first ~200 chars of body.
5. **Build list 1  -  keep-and-prioritize.** Score each ticket by alignment with current-priorities section of engineering context. Keep top N (default 15; halve if user tracker has <30 open tickets). Per ticket, one-line rationale tying to named priority or named user-surface / quality-bar item.
6. **Build list 2  -  merge-as-duplicates.** Group tickets by normalized-title similarity + body keyword overlap (cheap heuristic  -  not model call). Per group pick canonical ticket (most activity / best body), note others as likely dupes. One-line rationale per group ("same symptom  -  500 on POST /auth/login  -  filed 3 times since March"). Group worth listing only if 2+ members.
7. **Build list 3  -  close-as-stale.** Tickets with `lastActivityAt` older than stale threshold (default 90 days). One-line rationale per ticket ("no activity since 2025-11-18; labeled P3; no recent duplicates"). Exclude anything with labels hinting long-term tracking (e.g. `epic`, `parent`, `roadmap`, `paused`)  -  name exclusions in short "Not-stale despite age" footnote.
8. **Write** `backlog-grooming/{YYYY-Www}.md` atomically (`.tmp` → rename). Structure:

   ```markdown
   # Backlog grooming  -  {ISO-week}

   **Stale threshold:** {N} days. **Open tickets scanned:** {count}.

   ## Keep and prioritize (top {N})
   - [TICKET-ID] Title  -  rationale. {URL}

   ## Merge as duplicates (you review, you merge)
   **Group 1**  -  rationale. Canonical: [TICKET-ID]. Dupes: [...]

   ## Close as stale (you review, you close)
   - [TICKET-ID] Title  -  last activity {date}, rationale. {URL}

   ## Not-stale despite age (kept)
   - [TICKET-ID] {reason}
   ```

9. **Append to `outputs.json`**  -  type `"backlog-grooming"`, status `"draft"`, 2-3-sentence summary naming open-ticket count and sizes of three lists. Read-merge-write atomically.
10. **Summarize to user**  -  one paragraph: "Grooming pass at {path}. {X} to keep, {Y} dupe groups, {Z} stale. **I have not closed, merged, or reprioritized anything  -  the tracker is yours.** Skim the three lists, act on what you agree with."

## Hard nos

- **Never actually close, merge, or reprioritize tickets in tracker.** No tracker writes, ever. Output is list you review.
- Never auto-prune  -  even if ticket clearly match stale criteria, lands in list for review, not in "close" call.
- Never invent tickets not in tracker.

## Outputs

- `backlog-grooming/{YYYY-Www}.md`
- Appends to `outputs.json` with `{ id, type: "backlog-grooming", title, summary, path, status: "draft", createdAt, updatedAt }`.