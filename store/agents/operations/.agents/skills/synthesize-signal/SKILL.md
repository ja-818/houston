---
name: synthesize-signal
description: "Use when you say 'weekly briefing on {topic}' / 'what's moving in {space}' / 'summarize my X feed' / 'research {company} and give me a brief'  -  I synthesize news + research + social into a cited, structured brief via Exa, Perplexity, or Firecrawl. Writes to `signals/{slug}-{YYYY-MM-DD}.md`."
version: 1
tags: [operations, synthesize, signal]
category: Operations
featured: yes
image: clipboard
integrations: [linkedin, firecrawl, perplexityai]
---


# Synthesize Signal

Three signal kinds, one skill: market news, web research, social feed monitoring. Keep founder current without scanning feeds.

## When to use

- "weekly briefing on {topic}" / "what's moving in {our category}".
- "research {company} / {person} / {product} and give me a brief".
- "summarize my X feed" / "what did my follow-list post about".
- "what's the news on {regulation / event}".

## Steps

1. **Read `context/operations-context.md`.** Relevance anchors off founder's active priorities. If missing: `define-operating-context` first, stop.

2. **Classify request.**
   - **topic-brief**  -  "{topic}" (AI agents, vertical SaaS pricing, etc.). Use news + research sources.
   - **entity-brief**  -  named company, person, or product. Research-heavy; check news too.
   - **feed-digest**  -  founder's watched social feed (followers on X / LinkedIn / etc.). Needs connected social provider.

3. **Gather signal per classification.**

   **topic-brief + entity-brief:**
   - `composio search research` → execute by slug with query. Prefer providers returning source URLs (Exa, Perplexity).
   - `composio search news` → execute with time window (last 7 days default for weekly; last 30 for deep).

   **feed-digest:**
   - `composio search social` → list-home-timeline or list-posts-by-list tool for connected provider.
   - Pull posts from founder's follow-list for requested window.

4. **Filter and rank.**
   - Drop duplicates and near-duplicates.
   - Flag posts/articles from Key Contacts (from operating context) as higher-signal.
   - Rank by: (a) relevance to active priorities, (b) recency, (c) source authority.

5. **Synthesize structured brief.**

   Save to `signals/{slug}-{YYYY-MM-DD}.md`. Structure:

   - **TL;DR**  -  3 bullets max, founder-scannable.
   - **What moved**  -  grouped subsections by theme. Each bullet: claim + source URL. Cite every claim  -  no uncited assertions.
   - **Who's taking which position**  -  when sources contradict, list positions and who holds each.
   - **So what for us**  -  2-3 items: what threatens, what opens door, what goes in next investor/board update.
   - **Sources**  -  flat URL list with one-line descriptions, alphabetized by domain.

6. **Atomic writes**  -  `signals/{slug}-{YYYY-MM-DD}.md.tmp` → rename.

7. **Append to `outputs.json`** with `type: "signal"`, status "ready".

8. **Summarize to user**  -  TL;DR + the one "so what for us" item most warranting action.

## Outputs

- `signals/{slug}-{YYYY-MM-DD}.md`
- Appends to `outputs.json` with `type: "signal"`.

## What I never do

- **Cite without source URL.** Every claim traces to specific article or post  -  no "industry consensus" hand-waving.
- **Repost quote from founder's follow-list** to their own social  -  signal skill read-only.
- **Mark brief ready without uncertainty flags.** Single-source claim → flag it; sources contradict → say so.