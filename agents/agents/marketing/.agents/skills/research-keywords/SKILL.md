---
name: research-keywords
description: "Use when you say 'find keywords for {topic}' / 'build a keyword map' / 'what should we rank for' — I cluster keywords by intent and difficulty via Semrush (or Ahrefs), flag the 3 pillars worth owning, and draft cluster briefs. Maintains a living `keyword-map.md` + per-cluster detail at `keyword-clusters/{slug}.md`. No vanity keyword dumps."
integrations:
  seo: [semrush, ahrefs]
---

# Research Keywords

## When to use

- Explicit: "find keywords for {topic}", "build a keyword map", "what should we rank for", "keyword research on {topic}", "give me a cluster for {seed term}".
- Implicit: called by `write-blog-post` when target keyword missing, or by `analyze-content-gap` to size gap opportunities.
- Run many times — one cluster per invocation. Living `keyword-map.md` appends each new cluster.

## Steps

1. **Read positioning doc**: `context/marketing-context.md`. If missing, stop, tell user run `define-positioning` first. ICP + category framing decide which keywords worth ranking for.
2. **Read config**: `config/site.json`, `config/tooling.json`. No SEO keyword tool connected → ask ONE question: "Connect a keyword tool in the Integrations tab (Semrush / Ahrefs / etc) or paste a seed list of terms you think matter — which?"
3. **Discover tool**: `composio search keyword` (fall back `composio search seo`). Pick first matching connected slug.
4. **Build cluster** for requested topic:
   - Expand seed into 15-40 related terms (head + long-tail).
   - Pull per-term: search volume, keyword difficulty, SERP intent (informational / commercial / navigational / transactional).
   - Group into sub-clusters by intent or sub-topic.
   - Score each term priority: `(volume / difficulty) × intent-fit × ICP-fit`. ICP-fit references positioning doc.
5. **Write per-cluster detail** to `keyword-clusters/{cluster-slug}.md` atomically. Structure: cluster summary, ICP / positioning rationale, sub-clusters table (term / volume / difficulty / intent / priority), recommended first 3 posts to draft.
6. **Append to `keyword-map.md`** (living doc at agent root). File missing → create with short preamble. Append new section for this cluster with link to per-cluster detail file + top 5 priority terms. Atomic write: read → append in memory → write `*.tmp` → rename.
7. **Append to `outputs.json`** — `{ id, type: "keyword-map", title, summary, path: "keyword-clusters/{slug}.md", status: "draft", createdAt, updatedAt }`.
8. **Summarize to user** — name top 3 priority terms, flag best first post to draft, link both cluster detail + updated `keyword-map.md`.

## Never invent

Never estimate volume/difficulty without tool result. Tool returned partial data → mark gaps TBD. No fabricating SERP intent — read actual SERP when tool can fetch.

## Outputs

- Appends/updates `keyword-map.md` (living document at agent root).
- `keyword-clusters/{cluster-slug}.md` (per-cluster detail).
- Appends to `outputs.json` with type `keyword-map`.