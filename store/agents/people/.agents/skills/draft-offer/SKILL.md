---
name: draft-offer
description: "Use when you say 'draft an offer for {candidate}' / 'write the offer letter' / 'offer letter for {candidate} at {level}'  -  reads comp bands, equity stance, and leveling from `context/people-context.md` plus voice notes from the ledger, drafts the offer letter at `offers/{candidate-slug}.md` as `status: \"draft\"`. Never sent."
version: 1
tags: [people, draft, offer]
category: People
featured: yes
image: busts-in-silhouette
integrations: [googledocs, notion, loops]
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Draft Offer

## When to use

- Explicit: "draft an offer for {candidate}", "write the offer letter", "offer letter for {candidate} at {level}".
- Prereq: candidate record + debrief exist, founder decided to proceed.
- Always produces **draft**  -  never sends.

## Steps

1. **Read people-context doc** at `context/people-context.md`. If missing/empty, tell user: "I need your people context first  -  run the define-people-context skill." Stop. Pull leveling framework, **comp bands** (base + equity range per level + location multipliers), equity stance, voice notes, hard nos (e.g. "never counter on resignations"). Load-bearing.
2. **Read config**: `config/voice.md` for hiring-voice tone (greeting/sign-off patterns, sentence length). If missing, ask ONE targeted question naming best modality ("Connect your inbox via Composio so I can sample 2-3 past offers, or paste one past offer letter.")  -  write voice.md, continue.
3. **Read candidate context.** Open `interview-loops/{candidate-slug}.md` for debrief and agreed level/scope signal. Open `candidates/{candidate-slug}.md` for background. If neither exists, tell user run `debrief-loop` first. Stop.
4. **Confirm offer terms with founder.** ONE question if any missing: "Confirm  -  level: {X}, base: {Y}, equity: {Z}, start date: {D}, location: {L}. Override any of these? (Note: {Y} {Z} pulled from comp band {band-name} in context/people-context.md.)" If founder overrides outside band, require explicit written reason. Record in offer letter footer.
5. **Draft offer letter.** Structure:
   - Salutation (voice-matched per `config/voice.md` + people-context voice notes).
   - Role, title, level, reporting line.
   - Base comp (from comp band).
   - Equity  -  grant size, vesting schedule, cliff, type (ISO/NSO/RSU if stated in equity stance).
   - Start date + location/remote designation.
   - Benefits pointer ("per our benefits policy canon  -  context/people-context.md").
   - Contingencies (background check, reference check, authorization to work, signed IP/PIIA).
   - Deadline to accept.
   - Sign-off (voice-matched).
6. **Tone check.** Re-read draft against voice notes. If tone drifts (too corporate, too casual, wrong sign-off), revise before writing.
7. **Write to `offers/{candidate-slug}.md`** atomically (`*.tmp` → rename). Header file with metadata block: `{ level, base, equity, start, location, band, overrideReason? }` plus full letter body.
8. **Append to `outputs.json`**  -  `{ id, type: "offer", title, summary, path: "offers/{candidate-slug}.md", status: "draft", createdAt, updatedAt }`, write atomically. **Status stays `draft`  -  never flipped to `ready` by this skill.**
9. **Summarize to user**  -  one paragraph: name, level, base, equity, start, path to draft. End with: "This is a draft. I do not send offers. Review, edit, and send from your inbox."

## Never invent

- Never invent comp. Every number from comp band in context/people-context.md (or explicit founder override with written reason in letter footer).
- Never invent equity type or vesting. If equity stance silent, surface UNKNOWN and ask.
- Never promise benefits not in policy canon.
- Never commit start date without founder confirmation.
- Never send. Drafts only.

## Outputs

- `offers/{candidate-slug}.md`  -  draft offer letter with metadata header.
- Appends to `outputs.json` with type `offer`, status `draft`.