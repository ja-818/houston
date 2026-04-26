---
name: repurpose-content
description: "Use when you say 'turn {X} into {Y}' / 'repurpose this blog' / 'YouTube → blog draft'  -  I take any source (blog URL, YouTube transcript, article paste, competitor post) and reshape it for a target format (5 LinkedIn posts, an X thread, a newsletter, a blog draft, shareable insights). Writes to `repurposed/{source}-to-{target}.md`  -  hand to Social or Lifecycle to ship."
version: 1
tags: [marketing, repurpose, content]
category: Marketing
featured: yes
image: megaphone
integrations: [linkedin, twitter, youtube, firecrawl]
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Repurpose Content

## When to use

- Explicit: "turn this blog post into LinkedIn posts", "repurpose this YouTube video into a blog draft", "make an X thread from this article", "pull shareable insights from {URL}".
- Implicit: after `write-blog-post` lands big post, founder asks for social derivatives.
- Many source × target combos  -  pick format dynamic from user ask.

## Steps

1. **Read positioning doc**: `context/marketing-context.md`. If missing, stop and tell user run `define-positioning` first. Voice and positioning load-bearing for repurposed content.
2. **Read config**: `config/site.json` and `config/tooling.json`.
3. **Parse source + target** from user ask. Source can be:
   - Blog/article URL → fetch via `composio search web` or scrape tool.
   - YouTube URL → run `composio search youtube` to find transcript tool; fetch transcript + metadata.
   - Pasted article or transcript text.
   - Competitor blog URL (legal repurpose: insight + credit).
4. **Ingest source.** Pull full text (or transcript). Extract:
   - Thesis / core argument.
   - 5-10 distinct insights.
   - Quotable lines.
   - Concrete examples / numbers.
5. **Transform to target format.** Apply right template:
   - **LinkedIn posts** (default: 5 variants)  -  hook + value + CTA; each under 1300 chars; one hero quote or stat per post.
   - **X thread**  -  1 hook tweet + 6-12 body tweets; each ≤ 280 chars; thread-close CTA.
   - **Newsletter**  -  subject + preheader + 300-600 word body + clear CTA.
   - **Blog draft**  -  H1/H2 structure matching `write-blog-post` (shorter, 800-1200 words for YouTube → blog).
   - **Shareable insights**  -  bulleted insight-card list, each with quote and insight in one line.
   Match voice from positioning doc; no generic-ify.
6. **Write** to `repurposed/{source-slug}-to-{target}.md` atomic. Front-matter: sourceUrl, sourceType, targetFormat, status.
7. **Append to `outputs.json`**  -  `{ id, type: "repurposed", title, summary, path, status: "draft", createdAt, updatedAt }`.
8. **Summarize to user**  -  how many variants made, strongest hook, path.

## Never invent

If source no say, no put in repurposed piece. Rewriting competitor post (legal repurpose): credit source explicit and transform framing big  -  never plagiarize.

## Outputs

- `repurposed/{source-slug}-to-{target}.md`
- Appends to `outputs.json` with type `repurposed`.