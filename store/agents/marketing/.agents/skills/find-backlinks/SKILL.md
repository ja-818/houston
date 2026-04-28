---
name: find-backlinks
description: "Use when you say 'find backlinks' / 'who should we pitch for links' / 'link-building plan'  -  I identify target sites via SERP + your connected Ahrefs / backlink tool that match your niche, then draft per-target pitch emails grounded in what you actually offer them. Writes to `backlink-plans/{date}.md` with outreach drafts per target."
version: 1
tags: [marketing, find, backlinks]
category: Marketing
featured: yes
image: megaphone
integrations: [firecrawl, semrush, ahrefs]
---


# Find Backlinks

## When to use

- Explicit: "find backlinks", "who should we pitch for links",
  "link-building plan", "backlink targets for {topic}", "link
  prospecting".
- Implicit: inside launch plan when Head of Marketing need
  external amplification.
- Weekly or per-campaign cadence.

## Steps

1. **Read positioning doc**:
   `context/marketing-context.md`. If missing,
   stop. Tell user run `define-positioning` first. Positioning
   and ICP decide which sites relevant.
2. **Read config**: `config/site.json`, `config/tooling.json`. Also
   read `config/voice.md` if exist (for pitch-email tone). If
   voice missing, ask ONE question: "Connect your sent inbox via
   Composio so I can match your voice, or paste 2-3 emails you've
   sent  -  which?"
3. **Discover tool.** Prefer `composio search backlink` (dedicated
   backlink / link-gap tool); fall back to `composio search seo`
   (broader tool with backlink features); last resort
   `composio search web` for SERP analysis.
4. **Build target list** (15-30 prospects). Each target:
   - Domain + specific page/author to pitch.
   - Why them: topical relevance, Domain Authority (or proxy metric),
     past linking behaviour to similar products, ICP overlap.
   - Link opportunity type: guest post / resource page / broken-link
     replacement / "best X" list addition / expert round-up / podcast.
5. **Tier list**: Tier 1 (high-value, high-effort), Tier 2
   (medium / medium), Tier 3 (quick wins). Aim ~5 / 10 / 10.
6. **Draft per-target pitch emails.** Each target produce
   concise (<150 word) pitch: specific compliment tied to real
   post of theirs, value-exchange, soft CTA. Match voice from
   `config/voice.md` (if available) and positioning from shared
   doc.
7. **Write** to `backlink-plans/{YYYY-MM-DD}.md` atomically.
   Structure: Executive summary → Tier 1 targets (table + per-
   target pitch) → Tier 2 → Tier 3 → Outreach cadence recommendation.
8. **Append to `outputs.json`**  -  `{ id, type: "backlink-plan",
   title, summary, path, status: "draft", createdAt, updatedAt }`.
9. **Summarize to user**  -  count per tier, top 3 warmest targets,
   and path. Remind user: approval required before any
   pitch actually sent (skill drafts, not sends).

## Never invent

Never fabricate recipient's past work or publication's editorial
interests. Every compliment tie to real URL. Domain metrics
tool didn't return get marked TBD.

## Outputs

- `backlink-plans/{YYYY-MM-DD}.md`
- Appends to `outputs.json` with type `backlink-plan`.