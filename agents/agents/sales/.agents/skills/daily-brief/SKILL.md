---
name: daily-brief
description: "Use when you say 'brief me for today' / 'what's on today' / 'morning brief' — I produce today's calendar (from your connected Google Calendar), approvals queue (drafts in `outputs.json` awaiting your sign-off), and the top 3 moves for the day. Writes to `briefs/{YYYY-MM-DD}.md`."
---

# Daily Brief

One-screen morning brief. Founder read with coffee, know where start.

Derived from Gumloop templates #25 (Personal Assistant) + #29 (Brief me for upcoming day on Google Calendar), generalized to any connected calendar.

## When to use

- "brief me for today" / "brief me for the day" / "morning brief".
- "what's on today".
- Scheduled: morning routine (user-configured in Routines tab).

## Steps

1. **Read playbook.** Load `context/sales-context.md`. If missing, warn user but continue — brief still useful without.

2. **Pull today's calendar.** `composio search calendar` → list today's events. Per event capture: time, title, attendees, description. Flag any with "discovery" / "demo" / "QBR" / "renewal" in title as needing AE or CSM prep. If existing AE `call-prep.md` for meeting, link it.

3. **Build approvals queue.** Read each other agent's `outputs.json`, filter `status: "draft"` created last 48 hours. Group by agent, show title + path.

4. **Identify top-3 moves.** Read yesterday's activity across agents:
   - Any replies classified `INTERESTED` awaiting SDR draft approval?
   - Any deals moved stage yesterday, need AE follow-up?
   - Any customer health flipped YELLOW/RED overnight?
   - Any leads hit stall threshold overnight?

   Pick 3 highest-leverage. Each gets one-line description + copyable prompt to right agent.

5. **Format brief (one screen, 5 sections max):**

   1. **Today's meetings** — time · title · prep status.
   2. **Approvals queue** — N drafts awaiting sign-off, grouped by agent.
   3. **Top-3 moves** — each copyable one-liner.
   4. **Watch list** — stalled deals, red customers, high-value leads past stall threshold.
   5. **Yesterday in numbers** — leads added, calls held, deals progressed.

6. **Write atomically.** Write to `briefs/{YYYY-MM-DD}.md.tmp`, then rename. Overwrite any prior same-day brief (one brief per day).

7. **Append to `outputs.json`** (or update existing same-day entry):

   ```json
   {
     "id": "<uuid v4>",
     "type": "brief",
     "title": "Daily brief — {YYYY-MM-DD}",
     "summary": "<one-line summary of the 3 moves>",
     "path": "briefs/{YYYY-MM-DD}.md",
     "status": "ready",
     "createdAt": "<ISO>",
     "updatedAt": "<ISO>"
   }
   ```

8. **Summarize to user.** 3 moves inline in chat + path. If any meeting needs prep and lacks AE artifact, suggest running `@ae prepare-call` now.

## Outputs

- `briefs/{YYYY-MM-DD}.md`
- Appends (or updates) `outputs.json` with `type: "brief"`.