---
name: voice-calibration
description: "Use when you say 'calibrate my voice' / 'train on how I write'  -  I pull 10–20 recent outbound replies from your connected inbox (Gmail / Outlook / Intercom / Help Scout), extract tone cues (greeting, sign-off, sentence length, quirks), and write `config/voice.md`. Every `draft-reply` and `write-article` reads this before drafting."
version: 1
tags: [support, voice, calibration]
category: Support
featured: yes
image: headphone
integrations: [gmail, outlook]
---


# Voice Calibration

## When to use

- "calibrate my voice" / "train on how I write" / "pull my sent replies."
- After `define-support-context` when voice section is `TBD`.
- Re-run when tone drifted or want re-learn from recent replies.

## Ledger fields I read

- `domains.inbox.channels`  -  know which Composio slug to search "sent" folder against.

## Steps

1. **Read `context/support-context.md`.** If missing, run `define-support-context` first (or stop and tell me).

2. **Discover connected inbox.** Run `composio search inbox` or `composio search email-sent` (try both  -  exact slug depend on linked provider: Gmail, Outlook, Intercom, Help Scout, Zendesk, etc.). No inbox connected → tell me category to link (connect one: Gmail, Outlook, Intercom, Help Scout, Zendesk) and stop.

3. **Pull 10–20 recent outbound replies.** Execute list-sent / search-sent tool slug. Filter to support-looking replies (thread depth > 1, or label/folder contain `support`, or recipient not internal). Aim 10–20 most recent.

4. **Extract tone cues from samples:**
   - Greeting pattern (e.g. "Hey Jane," vs "Hi," vs no greeting).
   - Sentence length  -  short / medium / long.
   - Formality  -  casual / professional / direct.
   - Signature / sign-off convention.
   - Repeated phrases or quirks ("I'll dig in," "to be clear," em-dash use, etc.).
   - Forbidden-sounding phrases wrong coming from them (e.g. "I apologize for the inconvenience").

5. **Write `config/voice.md`** atomically. Include:
   - One-paragraph tone summary (direct / warm / human, specific traits).
   - 3–5 verbatim excerpts (shortest-but-most-representative) with PII redacted via `{Customer}` / `{Email}` placeholders.
   - "Forbidden phrases" bullet list.

6. **Update `context/support-context.md`.** Read current doc, find Tone + voice section, replace with 2-sentence summary pointing to `config/voice.md` for full detail. Write atomically (`.tmp` → rename).

7. **Update `universal.voice` in `config/context-ledger.json`**  -  `summary`, `sampleSource`, `sampleCount`, `capturedAt`.

8. **Append to `outputs.json`** with `type: "voice-calibration"`, `domain: "quality"`, title "Voice calibrated from {N} samples", summary = 2 sentences, path = `config/voice.md`, status `ready`.

9. **Summarize to me.** One paragraph: what tone look like ("direct, warm, em-dash heavy; never apologizes for inconvenience") and one line reminding every draft-reply / lifecycle-message / article in this agent now pulls from this.

## Outputs

- `config/voice.md` (raw samples + tone summary)
- `context/support-context.md` (voice section summary pointer)
- `config/context-ledger.json` (`universal.voice` block)
- Appends to `outputs.json` with `type: "voice-calibration"`, `domain: "quality"`.