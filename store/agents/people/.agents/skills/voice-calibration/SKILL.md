---
name: voice-calibration
description: "Use when you say 'calibrate my HR voice' / 'sample my past offers' / 'learn how I write for HR comms'  -  pulls recent HR outbound (offers, onboarding notes, feedback) from your connected inbox (Gmail or Outlook), extracts a tone fingerprint (greeting habits, closing habits, sentence length, formality), and appends it to the voice-notes section of `context/people-context.md`."
version: 1
tags: [people, voice, calibration]
category: People
featured: yes
image: busts-in-silhouette
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


# Voice Calibration

Offers, rejections, team announcements, PIPs, stay conversations  -  every skill this agent drafts against your voice. Skill samples how you actually write HR comms, writes tone fingerprint into `context/people-context.md` that every downstream draft references.

## When to use

- "calibrate my HR voice" / "sample my past offers" / "learn how I write for HR comms".
- "refresh voice notes in people-context doc".
- Called implicitly by `define-people-context` when voice-notes section thin or stale.

## Steps

1. **Read people-context doc** (own file): `context/people-context.md`. Read existing voice-notes section so run = append/merge, not overwrite. If doc missing, run `define-people-context` first.

2. **Pick source  -  ask ONE tight question if not obvious, with modality hint:**
   - "I can pull 10-20 recent HR-ish outbound messages from connected inbox, or paste 3-5 samples. Which?"
   - Connected: run `composio search inbox`; identify sent messages tagged with HR-relevant recipients (candidates, team); fetch.
   - Pasted: take paste verbatim.

3. **If connected, fetch.** Execute discovered inbox tool's list-sent-messages slug. Filter to HR-adjacent messages  -  candidates, employees, team-wide announcements. If inbox can't distinguish, ask for label/folder name or date window. Capture: send date, recipient role (inferred), subject, body.

4. **Extract tone fingerprint.** Per sample, note:
   - **Greeting pattern**  -  "Hey {name}," vs "Hi {name}  - " vs "{name},"
   - **Closing pattern**  -  "Talk soon,", " - {firstname}", "Best,".
   - **Sentence length**  -  average + range.
   - **Formality level**  -  1 (casual) to 5 (formal).
   - **Forbidden phrases**  -  what founder never says (e.g. never "circle back", never "synergy", never "reach out").
   - **Quirks**  -  em-dashes vs commas, one-line paragraphs vs dense, emoji usage, signoff variations, how they deliver hard news.
   - **Hard-news register**  -  how they write rejections, layoff notices, PIP intros. Different from celebratory messages; capture separately.

5. **Synthesize across batch.** Roll into 4-6 bullets:
   - Greeting habits.
   - Sentence length/cadence preference.
   - Formality level.
   - Forbidden phrases.
   - Hard-news register.
   - Any distinctive quirk.

   Plus 3-5 verbatim excerpts (short  -  2-3 sentences each) exemplifying voice.

6. **Append to voice-notes section of `context/people-context.md`.** Do NOT overwrite section  -  merge. Preserve anything founder already sharpened. Write atomically to `context/people-context.md.tmp` then rename.

7. **Also refresh `config/voice.md`**  -  same fingerprint, same verbatim excerpts, so future skills read locally without re-parsing shared doc. Atomic write.

8. **Append to `outputs.json`.** Read-merge-write atomically  -  summary entry pointing at update, not standalone file:

   ```json
   {
     "id": "<uuid v4>",
     "type": "voice-calibration",
     "title": "Voice calibrated  -  <YYYY-MM-DD>",
     "summary": "<2-3 sentences  -  N samples mined, top 3 fingerprint notes, what changed in context/people-context.md>",
     "path": "context/people-context.md",
     "status": "ready",
     "createdAt": "<ISO-8601>",
     "updatedAt": "<ISO-8601>"
   }
   ```

   (Entry points at live doc since no standalone artifact  -  voice notes live inside `context/people-context.md`.)

9. **Never invent.** Every quirk/fingerprint bullet must trace to actual samples. If sample set too thin (< 5 messages), say so and stop  -  shaky fingerprint worse than none.

10. **Summarize to user.** One paragraph: N samples mined, top 3 fingerprint bullets, where landed in people-context doc, what other agents now draft better.

## Outputs

- Updates voice-notes section of `context/people-context.md` (live doc).
- Refreshes `config/voice.md` with new fingerprint + excerpts.
- Appends to `outputs.json` with `type: "voice-calibration"`.