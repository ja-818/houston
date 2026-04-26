---
name: brief
description: "Use when you say 'morning brief' / 'what needs me today' / 'prep me for my 2pm' / 'post-meeting notes'  -  I produce the brief you asked for: `daily` rolls up inbox + calendar + chat + drive into today's plan · `meeting-pre` gives you a deep attendee pre-read with agenda + what they'll likely want · `meeting-post` turns a transcript into decisions + owners + follow-ups. Writes to `briefs/` or `meetings/`."
version: 1
tags: [operations, brief]
category: Operations
featured: yes
image: clipboard
integrations: [googledrive, googlecalendar, gmail, outlook, gong, fireflies, slack, linkedin]
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Brief

One primitive for daily-rhythm briefs anchoring week. You pick `mode`; I aggregate, prioritize, write.

## When to use

- `mode=daily`  -  "morning brief" / "what needs me today" / "here's my brain dump" / "today's rundown".
- `mode=meeting-pre`  -  "prep me for my 2pm" / "deep brief for my meeting with {X}" / "build me a pre-read".
- `mode=meeting-post`  -  "post-meeting notes from my last recording" / "summarize the call I just had with {X}".

## Ledger fields I read

- `universal.company`  -  context-match priorities + key contacts.
- `universal.positioning`  -  confirms `context/operations-context.md` exists; if not, stop + ask you run `define-operating-context` first.
- `domains.rhythm.timezone`  -  brief respects working hours.
- `domains.rhythm.briefDeliveryTime`  -  auto-trigger knows when "morning" is.
- `domains.people.vips`  -  who VIP for meeting prep.

Required field missing → ask ONE targeted question with modality hint (connected app > file > URL > paste), write atomically to `config/context-ledger.json`, continue.

## Parameter: `mode`

- `daily`  -  aggregate last 24h across inbox (Gmail / Outlook), calendar (Google Calendar / Outlook), team chat (Slack), recent drive activity (Google Drive) into today's plan. Writes `briefs/{YYYY-MM-DD}.md`.
- `meeting-pre`  -  deep attendee intel for ONE upcoming meeting: bio, role, prior email threads, recent public activity, shared history, suggested agenda, what they'll likely want. Writes `meetings/{YYYY-MM-DD}-{slug}-pre.md`.
- `meeting-post`  -  transcript (Fireflies / Gong) → decisions + owners + follow-ups + verbatim quotes worth keeping. Writes `meetings/{YYYY-MM-DD}-{slug}-post.md`.

## Steps

1. Read `config/context-ledger.json`. Missing required field for chosen mode → ask ONE targeted question with modality hint, write answer.

2. Read `context/operations-context.md`. Missing or empty → stop, tell me run `define-operating-context` first  -  never invent priorities, VIPs, hard nos.

3. Branch on `mode`:

   **If `mode = daily`:**
   - Detect brain-dump sub-mode: pasted >100 words task-flavored content → parse dump as primary input; else run default aggregate.
   - Pull last-24h data via Composio: inbox (`composio search inbox` / `gmail`), calendar (`googlecalendar`), team chat (`slack`), drive edits (`googledrive`). Category not connected → skip section, name explicitly.
   - Produce brief: Fires (≤3, verb + object), Today's meetings (1-line prep), What changed overnight, Can wait (default deferral), The one move.
   - Brain-dump sub-mode: bucket into urgent-fires / strategic / operational / future-ideas / personal; calendar reality check; 2-3 strategic picks grounded in active priorities from operating context; delegation candidates.

   **If `mode = meeting-pre`:**
   - Resolve target meeting (by ID, or best-match from calendar if you said "my 2pm").
   - Each external attendee, pull: recent email threads (inbox search), public activity (web search / LinkedIn via Composio), shared history (past meetings + emails).
   - Draft suggested agenda reflecting what they'll likely want based on thread history + my `context/operations-context.md` priorities.
   - Call out ONE thing not to forget.

   **If `mode = meeting-post`:**
   - Pull transcript from connected meeting recorder (Fireflies / Gong). Not connected → accept pasted transcript.
   - Extract decisions made, owners + dates per follow-up, open questions, 2-4 verbatim quotes worth keeping.
   - Flag anything deserving `log-decision` run (don't run inline  -  surface candidate).

4. Write atomically (`.tmp` then rename). Brief already exists today → append `-v2`, `-v3` (re-briefs happen).

5. Append to `outputs.json` with `{id, type, title, summary, path, status, createdAt, updatedAt, domain: "planning" or "people"}`. Type `"brief"` for `daily`, `"meeting-prep"` for `meeting-pre`, `"meeting-notes"` for `meeting-post`.

6. Summarize to you in chat: "one move" line (daily), or top-3 agenda items + thing not to forget (meeting-pre), or decisions + outstanding owners (meeting-post).

## Outputs

- `briefs/{YYYY-MM-DD}.md` (or `briefs/{YYYY-MM-DD}-dump.md` for brain-dump sub-mode).
- `meetings/{YYYY-MM-DD}-{slug}-pre.md` or `meetings/{YYYY-MM-DD}-{slug}-post.md`.
- Appends to `outputs.json`.

## What I never do

- Send outbound message during brief  -  flags reply-needed thread → drafting is `draft-message type=reply`.
- Invent attendee's role, history, preference  -  thin research → mark TBD.
- Touch inbox state (no archive, no label, no mark-as-read)  -  read-only.