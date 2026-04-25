---
name: synthesize-research
description: "Use when you say 'research {topic}' / 'I need a brief on {X}' — I run deep research via Exa (or your connected search provider), cite sources, and deliver a structured brief with 3–5 angles worth writing about. Writes to `research/{slug}.md` — hand to SEO for blog drafting or Growth for ad angles."
integrations:
  search: [exa, perplexityai]
  scrape: [firecrawl]
---

# Synthesize Research

Source template: Gumloop "AI Research Agent with Automated Report Generation". Adapted for hand-off to other four marketing agents, not 20-page investor memos.

## When to use

- "research {topic}" / "I need a brief on {topic}" / "what's state of {topic}".
- "summarize what's happening in {category}".
- Called implicitly by other HoM skills (`plan-launch`, `track-competitors`, `profile-icp`) when hit evidence gap needing dedicated research run.

## Steps

1. **Clarify scope in one short exchange (skip if user prompt already specific).** Ask:
   - Who brief for — you, or hand to other agent (SEO, Growth, Lifecycle, Social)?
   - What decision must unblock?
   - Depth — 15-min scan, 60-min dive, or deep?

2. **Read positioning doc** (own file): `context/marketing-context.md`. Ground brief in our ICP and category — generic internet research not a brief.

3. **Discover research tools at runtime.** Do NOT hardcode tool names. Run `composio search research`, `composio search web-search`, `composio search web-scrape` and pick best connected slug per step. If nothing connected, tell user which category to link (e.g. "connect web-search provider — Integrations tab") and stop.

4. **Run research in layers.** Log sources as you go — final brief needs citations:
   1. **Landscape scan** — players, category terminology, top 5-10 authoritative sources.
   2. **Evidence drill** — fetch top sources, extract claims, quotes, data points. Cite URL + fetch timestamp per claim.
   3. **Contradiction check** — where sources disagree? Name both sides; don't average to mush.
   4. **Relevance filter** — which findings matter for OUR ICP / OUR positioning / decision at hand? Cut rest.

5. **Structure brief (markdown, ~500-900 words standard depth).**

   1. **The question** — one sentence.
   2. **TL;DR** — 3-5 bullets user can act on today.
   3. **Key findings** — numbered. Each: claim, evidence (cite), implication for us.
   4. **Where sources disagree** — short section. Don't hide.
   5. **What we don't know** — explicit gaps. Mark `UNKNOWN` + kind of source that resolve.
   6. **Recommended next moves** — tagged by agent. Example: `[seo-content] Target cluster "{keyword}" — 8 of 10 top-ranking pages are thin.`
   7. **Sources** — URL + title + fetch timestamp.

6. **Never invent.** No synthesized "it seems likely that…" statements without cited source. If research thin, say so and stop — bad briefs cost more than no brief.

7. **Write atomically** to `research/{topic-slug}.md` — `{path}.tmp` then rename. `{topic-slug}` is kebab-case of topic (e.g. `research/geo-audits-category.md`).

8. **Append to `outputs.json`.** Read-merge-write atomically:

   ```json
   {
     "id": "<uuid v4>",
     "type": "research",
     "title": "<Topic>",
     "summary": "<2-3 sentences — the TL;DR>",
     "path": "research/<slug>.md",
     "status": "draft",
     "createdAt": "<ISO-8601>",
     "updatedAt": "<ISO-8601>"
   }
   ```

9. **Summarize to user.** One paragraph: question, TL;DR one line, 1 move next, path to brief.

## Outputs

- `research/{topic-slug}.md`
- Appends to `outputs.json` with `type: "research"`.