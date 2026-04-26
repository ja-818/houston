---
name: coordinate-interviews
description: "Use when you say 'schedule {candidate}'s loop' / 'coordinate the panel for {candidate}' / 'set up interviews'  -  proposes a schedule via your connected calendar (Google Calendar or Outlook), runs the prep-interviewer skill per panelist, and appends schedule plus briefs to `interview-loops/{candidate-slug}.md`. You approve and send."
version: 1
tags: [people, coordinate, interviews]
category: People
featured: yes
image: busts-in-silhouette
integrations: [googlecalendar, outlook, loops]
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Coordinate Interviews

## When to use

- Explicit: "schedule {candidate}'s loop", "coordinate the panel for {candidate}", "set up interviews for {candidate}", "book the loop".
- Prereq: candidate record exist + passed screening.
- One invocation per candidate loop.

## Steps

1. **Read people-context doc** at `context/people-context.md`. If missing/empty, tell user: "I need your people context first  -  run the define-people-context skill." Stop.
2. **Read candidate record** at `candidates/{candidate-slug}.md`. If missing, tell user run `screen-resume` or `score-candidate` first. Stop.
3. **Ask panel + window** if not given  -  ONE question: "Who's on the panel (emails or names) and what's the target window (e.g. 'next Tue-Thu afternoons')? Also  -  expected duration per interview (30 / 45 / 60 min)?"
4. **Discover calendar tool via Composio.** Run `composio search calendar` for calendar slug (Google Calendar / Outlook). No calendar connected → tell user which category to link from Integrations. Stop.
5. **Check free/busy.** Execute tool slug to pull free/busy for every panelist + candidate (if availability shared). Find non-conflicting slots in target window fitting duration. Surface conflicts explicit.
6. **Propose schedule.** Lay out loop as block of back-to-back or spaced interviews, one per panelist, each with proposed start / end / timezone. Candidate need breaks → add them.
7. **Draft invites (never send).** Per slot, draft invite text: title, attendees, duration, location / video link placeholder, description (1-2 sentences tying to role + panelist's focus). Save drafts inline  -  no `send` / `create_event` mutation without founder's explicit confirmation.
8. **Run `prep-interviewer` per panelist.** Call once per interviewer so every brief appends to `interview-loops/{candidate-slug}.md`.
9. **Write schedule block.** Append dated `## Loop scheduled  -  {YYYY-MM-DD}` section to `interview-loops/{candidate-slug}.md` with proposed schedule table, draft invites, flagged conflicts. Atomic write (`*.tmp` → rename).
10. **Append to `outputs.json`**  -  `{ id, type: "loop-scheduled", title, summary, path: "interview-loops/{candidate-slug}.md", status: "draft", createdAt, updatedAt }`, atomic write.
11. **Summarize to user**  -  one paragraph: proposed schedule, flagged conflicts, reminder invites are drafts, path to loop file. End with: "Reply `send invites` after reviewing and I'll execute the calendar mutation."

## Never invent

- Never send calendar invite without founder's explicit approval. Drafts only.
- Never invent panelist availability  -  free/busy unreadable (private calendar, no connection) → surface + ask user confirm manually.
- Never infer timezone; ask if unclear.

## Outputs

- `interview-loops/{candidate-slug}.md`  -  schedule + invites appended. Per-interviewer briefs appended via `prep-interviewer`.
- Appends to `outputs.json` with type `loop-scheduled`.