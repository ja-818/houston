---
name: pitch-podcast
description: "Use when you say 'pitch me onto podcasts' / 'podcast outreach' / 'find shows for our ICP' — I identify target shows by audience fit (via Listen Notes or similar) and draft per-show pitches: hook based on your positioning, angle, proof, clear ask. No template spam. Writes to `podcast-pitches/{date}.md` — one per show, send from your own email."
integrations:
  podcasts: [listennotes]
---

# Pitch Podcast

## When to use

- User: "pitch me onto podcasts" / "podcast outreach" / "find shows for our ICP" / "draft pitches for {N} shows".
- Monthly cadence natural — routinize OK.

## Steps

1. **Read positioning doc**: `context/marketing-context.md`. Missing or empty → stop, tell user run `define-positioning` first.

2. **Read `config/voice.md` and `config/podcast-targets.json` (if exists).** `podcast-targets.json` missing → ask one targeted question:
   > "What angle do you want to pitch? E.g. 'solo-founder SaaS ops', 'AI for back-office accounting', 'bootstrapped-to-profitability'. And which audience — founders, operators, investors, technical buyers? I'll write this to `config/podcast-targets.json`."
   Capture `{ angle, audience, excludeShows?, capturedAt }`.

3. **Discover target podcasts.** Run `composio search podcast` (or `composio search listen-notes`) to find podcast-directory tool. Execute with angle + audience, pull 10-20 candidates. No directory tool connected → tell user which category to link, stop. Never fabricate shows.

4. **Rank and filter.** Per candidate, judge:
   - **Audience fit.** Matches ICP from positioning doc? Named audience segment?
   - **Show health.** Publishes monthly+, recent episodes last 90 days.
   - **Host angle.** Host interview operators / founders our space?
   - **Reachability.** Contact surface exist (email, form, Twitter)?
   Keep top 5-8. Drop dormant / off-topic / unreachable.

5. **Draft per-show pitches.** Per kept show:
   - **Hook** (subject line + opening sentence) — reference specific recent episode or angle so host see we listened.
   - **Angle** — specific episode idea we bring, tied to positioning statement. 2-3 sentences.
   - **Proof** — 2-3 bullets: your role, specific outcome / metric, surprising take for air.
   - **Ask** — low-friction: "15 min to see if it's a fit?" / "Reply if the angle resonates and I'll send a one-pager."
   - Voice: match `config/voice.md`; err warm + specific.

6. **Write** all pitches into one file at `podcast-pitches/{YYYY-MM-DD}.md` atomically. Per-show sections. File structure:
   ```markdown
   # Podcast Pitch Batch — {YYYY-MM-DD}

   **Angle:** {from config}
   **Audience:** {from config}
   **Shows targeted:** {count}

   ---

   ## 1. {Show name} — host: {host}
   - Audience: {description}
   - Why this show: {one line}
   - Recent episode referenced: {title + URL}
   - Contact: {email / form URL / handle}

   **Subject:** {subject line}

   {full pitch email body}

   ---

   ## 2. {Show name} ...
   ```

7. **Append to `outputs.json`** — new entry, `type: "podcast-pitch"`, `path: "podcast-pitches/{YYYY-MM-DD}.md"`, `status: "draft"`.

8. **Summarize to user** — one paragraph: "{N} shows pitched: {list of show names}. Top match: {show} — host interviews {ICP} and ran a recent episode on {angle}. Review, pick which to send, then send from your inbox — I never send."

## Outputs

- `podcast-pitches/{YYYY-MM-DD}.md`
- Appends to `outputs.json` with `{ id, type: "podcast-pitch", title, summary, path, status: "draft", createdAt, updatedAt }`.