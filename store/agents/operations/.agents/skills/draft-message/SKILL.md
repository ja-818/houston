---
name: draft-message
description: "Use when you say 'draft responses' / 'reply to {name}' / 'track this follow-up' / 'draft the renewal email for {vendor}'  -  I write in your voice and save as a draft in your connected inbox (never sends). Pick `type`: `reply` answers an inbound thread · `followup` either logs a new commitment to your follow-up ledger or drafts the fulfillment for one that's due · `vendor` writes renewal / cancel / trial / reference-check outreach grounded in contract terms."
version: 1
tags: [operations, draft, message]
category: Operations
featured: yes
image: clipboard
integrations: [gmail, outlook]
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Draft Message

One drafting primitive for every outbound. Your voice, your approval, your send button  -  never send, never commit, never sign.

## When to use

- `type=reply`  -  "draft responses" / "reply to {name}" / "draft replies to inbound emails in my triage".
- `type=followup`  -  "track this follow-up" (TRACK sub-mode) / "remind me to follow up with {X}" (TRACK) / "handle my due follow-ups" (HANDLE).
- `type=vendor`  -  "draft renewal-negotiation email" / "write cancel email for {SaaS}" / "reach out to {supplier} for trial" / "reference-check email for {vendor}".

## Ledger fields I read

- `universal.voice`  -  tone summary + sample source + count. Without this, cannot write in your voice.
- `universal.positioning`  -  confirms `context/operations-context.md` exists.
- `domains.people.vips`  -  affects deference + formality for reply/followup drafts.
- `domains.vendors.posture`  -  risk appetite, signature authority, term preferences, paper preferences (vendor drafts).

If `universal.voice` missing, ask with modality hint: "Best way is connect your inbox (Gmail / Outlook via Composio) so I sample 20-30 sent messages  -  otherwise, paste 3-5 recent replies you wrote." Write to ledger, continue.

## Parameter: `type`

- `reply`  -  answer inbound thread. Pull thread from connected inbox, draft reply in your voice, save as draft in inbox provider, log human-readable record. Output: `drafts/reply-{YYYY-MM-DD}-{thread-slug}.md`.
- `followup`  -  two sub-modes:
  - TRACK (default when you say "track this" / "remind me")  -  extract commitment (who, what, by when), append to `followups.json`, no draft yet.
  - HANDLE (when you say "handle due follow-ups" / "draft the overdue ones")  -  read `followups.json`, for each follow-up with due date ≤ today, draft either fulfillment or honest bump ("Following up on the {X} I promised by {Y}  -  status: {Z}"). Output: `drafts/followup-{YYYY-MM-DD}-{slug}.md`.
- `vendor`  -  renewal / cancel / trial / reference-check outreach. Grounded in contract terms from `contracts/` + vendor posture from `context/operations-context.md`. Output: `drafts/vendor-{type}-{vendor-slug}.md`.

## Steps

1. Read ledger; fill `universal.voice` + any `domains.vendors.posture` gap with ONE modality-ranked question.
2. Read `context/operations-context.md`  -  priorities, key contacts, hard nos, voice notes.
3. Branch on `type`:

   **If `type = reply`:**
   - Pull target thread(s) from connected inbox (Gmail / Outlook via Composio). If you named someone, resolve most-recent unanswered thread.
   - Read thread history + `context/operations-context.md` + `config/voice.md`.
   - Draft reply: direct, opinionated when warranted, voice-matched. No hedging ("I think maybe"), no filler greetings.
   - Save as DRAFT in inbox via Composio  -  use inbox provider's own draft facility, never send. Also write human-readable record to `drafts/reply-{YYYY-MM-DD}-{slug}.md` for offline review.

   **If `type = followup` + TRACK sub-mode:**
   - Parse commitment from user input or referenced outbound (who owes what to whom, by when).
   - Append to `followups.json` with `{id, createdAt, updatedAt, with, commitment, dueAt, status: "pending", sourceArtifact}`.
   - No draft yet  -  tracking is deliverable.

   **If `type = followup` + HANDLE sub-mode:**
   - Read `followups.json`. For every follow-up with `status == "pending"` and `dueAt <= today`:
     - If commitment fulfilled elsewhere (outbound exists in `drafts/` addressing it), flip to `status: "ready-to-close"`.
     - Else, draft fulfillment or honest bump. Use voice. Save to `drafts/followup-{YYYY-MM-DD}-{slug}.md` AND as inbox draft via Composio.

   **If `type = vendor`:**
   - Read vendor's contract if present (`contracts/{vendor-slug}/`). Extract: term, renewal window, price, unfavorable clauses.
   - Read vendor posture from `context/operations-context.md` (risk appetite, signature authority, paper preference).
   - Draft requested outbound sub-type:
     - Renewal-negotiation: lead with data (usage / value), specific ask (price, term, terms), walk-away.
     - Cancel: direct, grateful, specific (cite clause + effective date).
     - Trial: positioning fit + specific use case + success criteria + honest timeline.
     - Reference-check: 3-5 targeted questions based on what we're evaluating against.
   - Save as inbox draft via Composio + write record to `drafts/vendor-{sub-type}-{vendor-slug}.md`.

4. Every branch: write atomically (`.tmp` → rename).
5. Append to `outputs.json` with `{id, type, title, summary, path, status: "draft", createdAt, updatedAt, domain: "people" or "vendors"}`. Type = `"reply-draft"` / `"followup-log"` / `"followup-draft"` / `"vendor-draft"`.
6. Summarize to you: path to draft + what to double-check before approving.

## Outputs

- `drafts/reply-{YYYY-MM-DD}-{slug}.md`
- `followups.json` (upsert) and/or `drafts/followup-{YYYY-MM-DD}-{slug}.md`
- `drafts/vendor-{sub-type}-{vendor-slug}.md`
- Appends to `outputs.json`; inbox drafts via Composio for reply / followup-handle / vendor types.

## What I never do

- Send, schedule-send, or auto-archive. Every outbound is draft you approve + send from your own inbox.
- Commit on your behalf (no "I'll get it to you by Friday" unless you said so in thread).
- Invent vendor usage stats or contract terms  -  if contract isn't in `contracts/` or pasted, mark TBD and ask.
- Negotiate price without explicit ask from you (e.g. "ask for 20% off annual").