---
name: draft-reply
description: "Use when you say 'draft a reply for {id}' / 'draft my response' / 'answer this ticket' — I pull the customer dossier, match your voice from past sent messages, and write `conversations/{id}/draft.md` without sending. Addresses the specific ask (bug / how-to / billing) and never promises a date you haven't approved."
integrations:
  inbox: [gmail, outlook]
  helpdesk: [intercom, help_scout, zendesk]
---

# Draft Reply

## When to use

- You say "draft a reply for {conversation id}" or "draft my response."
- `scan-inbox` surfaced thread in morning brief, you clicked in.
- Triaged conversation has status `open` / `waiting_founder`, no `draft.md` yet.
- **Never** called to send — this skill drafts only.

## Ledger fields I read

- `universal.positioning` — know `context/support-context.md` exist; doc carry product surface, voice, routing rules, forbidden phrases, SLA tiers.
- `universal.voice` — sample summary + count. If missing or `sampleCount < 5`, run `voice-calibration` first (or ask you paste 3–5 own recent replies).
- `domains.inbox.channels` — know which Composio slug to pull "sent" folder from for tone sampling.

If required field missing, ask ONE targeted question with modality hint (Composio connection > file drop > URL > paste), write field, continue.

## Steps

1. **Read `context/support-context.md`.** If missing/empty, stop and tell me run `define-support-context` first.
2. **Load thread** from `conversations/{id}/thread.json`. Identify latest customer message — draft respond to that.
3. **Chain `customer-view view=dossier`** for customer on thread. Pull: plan, MRR, open bug-candidates, open followups (from `followups.json`), any `churn-flags.json` entry, last 3 conversations from history.
4. **Sample voice.** Read `config/voice.md`. If missing or sampleCount < 5, run `voice-calibration` first. Mirror tone cues: greeting, sign-off, sentence length, whether I use customer's first name. No "I apologize for the inconvenience." No corporate hedging.
5. **Draft reply.** Match ask:
   - **Bug** — acknowledge, confirm repro if possible, state next step. Never promise fix date I haven't approved — say "I'll get back to you with a timeline."
   - **How-to** — answer crisp, link KB article if one exists at `articles/{slug}.md` (check before linking).
   - **Billing** — state facts, propose action (refund / credit / plan change). Escalate to me before committing.
   - **Churn language** — tight, honest, no guilt. Offer genuine option; never promise what not policy in `context/support-context.md`.
6. **Append dossier snippet** to `conversations/{id}/notes.md` (plan, MRR, open bugs, churn status) so I have context when approving.
7. **Write `conversations/{id}/draft.md`** atomically. Update `conversations.json` entry: status = `waiting_founder`, refresh `updatedAt`.
8. **Append to `outputs.json`** with `type: "reply-draft"`, `domain: "inbox"`, title = "Reply to {customer} re {subject}", summary = opening line, path.
9. **Chain `promise-tracker`.** If draft contains commitment ("I'll check with engineering by Friday", "I'll ship next week"), run `promise-tracker` so due date lands in `followups.json`.

## Outputs

- `conversations/{id}/draft.md`
- `conversations/{id}/notes.md` (append dossier snippet)
- `conversations.json` entry update
- Appends to `outputs.json` with `type: "reply-draft"`, `domain: "inbox"`.

## What I never do

- Send reply. You ship every outbound.
- Promise date / refund / exception not in `context/support-context.md`.
- Invent customer history if dossier thin — mark UNKNOWN and ask.