---
name: triage-inbound-request
description: "Use when a feature request, bug report, or idea arrives from outside engineering (user email, sales call note, support ticket, founder shower thought) — I classify it as roadmap-change / ticket / design-doc / skip with reasoning, and write a copy-paste prompt for whichever skill owns it next (plan-roadmap / triage-bug-report / draft-design-doc). Writes to `inbound-triage/{slug}.md`."
---

# Triage Inbound Request

Founders get feature requests everywhere — users, sales calls, customer emails, investor suggestions, own shower thoughts. No triage step = requests pile up or get built impulsively. Skill catch + route.

## When to use

- "someone filed feature request — where go?"
- "user emailed asking for {X} — triage it".
- "sales call note about {pain} — what do".
- Founder has idea, wants know if roadmap-sized, sprint-sized, design-doc-sized, or not-this-quarter-sized.

## Steps

1. **Read engineering-context.md** (own file). If missing, STOP — tell user run `define-engineering-context` first. Route without priorities or quality bar = coin flip.

2. **Ingest raw request.** Founder paste raw text (user email, call note, Slack DM, idea one-liner) or give URL. Fetch URL via `composio search web-scrape`. Never edit or clean language — preserve verbatim ask so downstream agents see what requester actually said.

3. **Extract 4 fields** (ask ONE question only if field unclear from raw text):
   - **Who** — requester (user / prospect / internal / founder).
   - **What** — feature or change, one sentence.
   - **Why** — pain or outcome, one sentence.
   - **Evidence** — signal strength. One user, pattern, or investor opinion?

4. **Classify.** Pick ONE verdict:

   - **`roadmap-change`** — big enough to alter current quarter plan. Signal: bigger than ticket, multiple users or strategic driver, shifts priority order. Route to HoE's `plan-roadmap` (or flags delta on current roadmap).
   - **`ticket`** — small, well-scoped, actionable today. Signal: one user pain, known fix, fits sprint. Route to `backlog-triage`.
   - **`design-doc`** — technical question or architectural change needs thinking before ticket. Signal: "should we" or "how would we", multiple valid approaches, breaking changes. Route to `tech-lead`.
   - **`skip`** — off-strategy, solved elsewhere, one-off preference, or weak signal. Name reason; write kind user-facing decline note founder can send back.

   One verdict per request. If want two, split request into two and triage each.

5. **State reasoning.** Two or three sentences. Cite context doc priorities when verdict is `skip` or `roadmap-change`. Cite quality bar when verdict is `design-doc`. No hand-waving.

6. **Write copy-paste handoff prompt.** Exact text founder sends to receiving agent chat. Examples:
   - `roadmap-change` → paste to HoE chat:
     *"Re-evaluate Q{n} roadmap. Inbound: {summary}. Evidence: {signal}. Use plan-roadmap; cite this triage doc at {path}."*
   - `ticket` → paste to `backlog-triage` chat:
     *"Triage this incoming request to a ticket: {verbatim ask with requester attribution}. Use triage-bug-report or score-ticket-priority as applicable."*
   - `design-doc` → paste to `tech-lead` chat:
     *"Draft a design doc exploring: {question}. Constraints from context doc: {cite}. See triage at {path}."*
   - `skip` → user-facing decline message:
     *"Thanks for flagging {feature}. We're not planning to build this right now because {reason}. {What we ARE doing that might help}."*

7. **Output structure (markdown, ~200-400 words), `inbound-triage/{slug}.md`:**

   1. **Source** — requester, channel, date.
   2. **Verbatim request** — quoted, unedited.
   3. **Extracted fields** — who / what / why / evidence.
   4. **Verdict** — one of `roadmap-change` / `ticket` / `design-doc` / `skip`.
   5. **Reasoning** — 2-3 sentences citing context doc.
   6. **Handoff prompt** — exact copy-paste text.
   7. **Follow-up** — what to watch (e.g. "if 2 more users ask in next 30 days, flip to roadmap-change").

8. **Never invent user's pain.** If request vague, mark fields as `UNKNOWN — ask the requester for {specific follow-up question}`.

9. **Write atomically** to `inbound-triage/{slug}.md` — `{path}.tmp` then rename. `{slug}` = kebab-case of short summary (e.g. `inbound-triage/sso-saml-enterprise.md`).

10. **Append to `outputs.json`.** Read-merge-write atomically:

    ```json
    {
      "id": "<uuid v4>",
      "type": "inbound-triage",
      "title": "Triage — <short summary>",
      "summary": "<2-3 sentences — verdict + why + target agent>",
      "path": "inbound-triage/<slug>.md",
      "status": "ready",
      "createdAt": "<ISO-8601>",
      "updatedAt": "<ISO-8601>"
    }
    ```

    (Triage = factual routing decision — ships as `ready`, not `draft`.)

11. **Summarize to user.** One paragraph: verdict + receiving agent + copy-paste prompt + path to artifact.

## Outputs

- `inbound-triage/{slug}.md`
- Appends to `outputs.json` with `type: "inbound-triage"`.