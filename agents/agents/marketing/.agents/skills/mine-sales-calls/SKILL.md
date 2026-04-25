---
name: mine-sales-calls
description: "Use when you say 'mine my sales calls' / 'extract objections from my calls' — I pull transcripts from your connected meeting app (Gong / Fireflies / Circleback), extract verbatim customer phrases, rank pains by frequency, surface objection patterns, and flag positioning wedges. Writes to `call-insights/{date}.md` — the single best source for ad copy and landing-page headlines."
integrations:
  meetings: [gong, fireflies]
---

# Mine Sales Calls

Source template: Gumloop "Sales Call Intelligence for B2B Product Marketing". Highest-leverage research input Head of Marketing has — verbatim customer language beats any marketer paraphrase.

## When to use

- "mine my sales calls" / "what are customers saying" / "extract objections from my calls".
- "pull positioning signals from last week's calls".
- Called implicitly by `define-positioning` (when pushing for verbatim quotes) and `profile-icp` (when building pains / objections sections).

## Steps

1. **Read positioning doc** (own file): `context/marketing-context.md`. Anchor mining — look for quotes that support, update, or contradict current claims.

2. **Pick source — ask ONE tight question if not obvious, with modality hint:**
   - "I can pull from your connected meeting-notes app, or you can paste 1-3 transcripts. Which?"
   - Connected: run `composio search meeting-notes`; list recent calls; ask user which batch (last 5, last 10, date range, specific account).
   - Pasted: take paste verbatim.

3. **If connected, fetch.** Execute discovered tool's list-recent-calls slug, then list-transcript slug per call. Capture: call date, attendees, duration, full transcript.

4. **Extract per call.** For each transcript:
   - **Verbatim pain language** — 3-5 direct quotes where customer describes problem. Preserve word-for-word.
   - **Verbatim positioning language** — how they describe category, our product, competitors. Preserve.
   - **Objections raised** — actual objection, context, whether handled in call.
   - **Buying signals** — budget mentions, timeline mentions, stakeholder mentions.
   - **Surprises** — anything contradicting current positioning doc. Gold.

5. **Synthesize across batch.** Roll up:
   - Pain patterns — which pain language repeats, with frequency.
   - Objection patterns — top 3 objections by frequency.
   - Category language — words customers actually use (vs. what we use on site).
   - Deltas vs. positioning doc — what to add / change / remove in `context/marketing-context.md`.

6. **Structure artifact (markdown, ~400-700 words).** For batch, write `call-insights/{YYYY-MM-DD}-batch.md`. For single deep-dive on one call, write `call-insights/{call-slug}.md`. Structure:

   1. **Scope** — N calls, date range, accounts.
   2. **Top verbatim pains** — quoted, with speaker + call date.
   3. **Top verbatim positioning language** — how customers describe category + us + competitors.
   4. **Top 3 objections** — verbatim + context + handled/unhandled.
   5. **Buying signals spotted** — list.
   6. **Surprises + deltas vs. positioning doc** — bulleted recommendations for updates.
   7. **Hand-off list** — which agents get which insight. Example: `[lifecycle-email] Use phrase "{quote}" in the re-activation drip subject line.`

7. **Never invent.** Every quote ties to transcript + speaker + timestamp. If not said, not said — don't round up or summarize into quote. If transcripts too thin, say so and stop.

8. **Write atomically** — `{path}.tmp` then rename.

9. **Append to `outputs.json`.** Read-merge-write atomically:

   ```json
   {
     "id": "<uuid v4>",
     "type": "call-insight",
     "title": "<Call-insights batch YYYY-MM-DD>" | "<Call with {account}>",
     "summary": "<2-3 sentences — top pain pattern + top objection + delta vs. positioning>",
     "path": "call-insights/<slug>.md",
     "status": "draft",
     "createdAt": "<ISO-8601>",
     "updatedAt": "<ISO-8601>"
   }
   ```

10. **Offer positioning-doc update.** If deltas meaningful, ask user: "Want me to update `context/marketing-context.md` with these customer phrasings?" — if yes, run `define-positioning` in update mode.

11. **Summarize to user.** One paragraph: top pain phrase, top objection, biggest positioning delta, path to artifact.

## Outputs

- `call-insights/{YYYY-MM-DD}-batch.md` or `call-insights/{call-slug}.md`.
- Appends to `outputs.json` with `type: "call-insight"`.
- May trigger `define-positioning` run (user approval required).