---
name: write-content
description: "Use when you say 'draft a blog post' / 'LinkedIn post' / 'X thread' / 'newsletter' / 'Reddit reply'  -  I write channel-native copy in your voice, grounded in your positioning. Pick a `channel`: `blog` (2,000–3,000 words, mirrored to Google Docs) · `linkedin` (hook-first native post) · `x-thread` (5–12 tweets) · `newsletter` (one through-line) · `reddit` (value-first reply). Drafts only  -  you always post."
version: 1
tags: [marketing, write, content]
category: Marketing
featured: yes
image: megaphone
integrations: [googledocs, linkedin, twitter, reddit, mailchimp, firecrawl]
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Write Content

Channel-native drafting, one skill. `channel` param pick shape. Core discipline  -  positioning, voice, no invented stats, drafts only  -  shared across channels.

## Parameter: `channel`

- `blog`  -  2,000-3,000 word SEO-aware post → `blog-posts/{slug}.md`.
- `linkedin`  -  hook-first native post → `posts/linkedin-{slug}.md`.
- `x-thread`  -  5-12 tweet thread → `threads/x-{slug}.md`.
- `newsletter`  -  subject + preview + body, one through-line →
  `newsletters/{YYYY-MM-DD}.md`.
- `reddit`  -  value-first community reply (source thread via
  Composio/Firecrawl) → `community-replies/{source-slug}.md`.

User name channel plain English ("X thread", "Reddit reply", "this week's newsletter") → infer. Ambiguous → ask ONE question naming 5 options.

## When to use

- Explicit: "draft a {blog post / LinkedIn post / X thread /
  newsletter / Reddit reply} on {topic}", "write me a post about {X}",
  "respond to this thread at {URL}".
- Implicit: called by `plan-campaign` (launch / announcement) for
  channel pieces, or by `monitor-competitors`
  (social-feed) on flagged high-signal thread.

## Ledger fields I read

Read `config/context-ledger.json` first. Required every channel:

- `company`  -  name, pitch30s, stage.
- `voice`  -  summary + sampleCount; missing → ask ONE question
  (modality: Composio-connected LinkedIn / inbox > paste 2-3 samples).
- `positioning`  -  from `context/marketing-context.md`. Missing →
  ask: "want me to draft your positioning first? (one skill, ~5m)"
  and stop.

By channel:

- `linkedin` | `x-thread` | `reddit` → `domains.social.platforms`,
  `domains.social.topics`.
- `newsletter` → `domains.email.platform` (summary tell user
  which platform to paste into).

Missing field → ask ONE targeted question, write atomically
(`.tmp` → rename), continue. Never re-ask.

## Steps

1. **Read ledger + positioning.** Load `config/context-ledger.json`
   and `context/marketing-context.md`. Gather missing required fields
   per list above (ONE question each, best-modality first).
2. **Resolve channel + topic.** Confirm param. Topic not explicit →
   ask ONE question: "What's the angle / hook /
   target keyword?"
3. **Research pass (channel-scaled).**
   - `blog`  -  run `composio search seo` / `composio search web` for
     top 5-10 SERP results on target keyword; extract angle
     gaps + expected structure.
   - `linkedin` | `x-thread`  -  optional, `composio search web` for
     1-3 grounding facts. Skip pure story/opinion.
   - `newsletter`  -  pull source material (paste, user links, recent
     `blog-posts/` entries indexed in `outputs.json`). Nothing →
     ask: "What happened this week worth an email?"
   - `reddit`  -  run `composio search web-scrape` (or
     `composio search reddit`), fetch thread URL, pull OP + top
     3-5 comments. Scrape fail → ask user paste.
4. **Assess value (reddit only).** One sentence: "do we genuinely have
   something to add here?" No → say so, stop. No filler replies.
5. **Draft to channel shape.**
   - `blog`  -  H1 (keyword-forward, human) → intro (hook + promise +
     TOC) → H2/H3s covering SERP demand + one contrarian section tied
     to positioning → inline internal-link suggestions → one CTA from
     positioning → meta description (≤155 chars) → slug (kebab-case)
     → image brief (alt text + 2-3 ideas).
   - `linkedin`  -  line 1 hook (4-10 words, contrarian / specific
     number) → whitespace, short lines → one clear takeaway →
     3-6 short paragraphs → CTA or question → 0-3 specific hashtags.
   - `x-thread`  -  tweet 1 scroll-stopping hook (≤280 chars,
     no emoji fluff) → 4-10 numbered progression tweets (each a beat,
     ≤280) → final CTA tweet (follow / reply / link). X punchier
     than LinkedIn.
   - `newsletter`  -  pick ONE through-line (can't state in
     one sentence → ask user pick headline) → subject
     (≤60 chars, specific) → preview (50-90 chars) → body of 3-5
     short sections serving through-line → one primary CTA.
     Plain-text-first, cite source URLs inline.
   - `reddit`  -  acknowledge OP's specific question (1 line) →
     concrete value 2-4 short paragraphs (framework, number, gotcha,
     step-by-step, counter-take) → optional soft mention only if
     directly relevant, after value, name not link → no
     signatures. Register shift community casual.
6. **Voice match.** Every channel respect `voice`-ledger fields
   (formality, emoji habit, sentence length). Voice sample
   flat → default direct + warm.
7. **Write atomically** to channel path (`*.tmp` → rename). Slug
   = kebab(first-5-hook-words) unless another rule above applies.
   File front-matter: `type`, `channel`, `topic`, plus channel-
   specific fields (blog: title/slug/metaDescription/targetKeyword/
   wordCount; newsletter: throughLine/sources; reddit: source URL
   + subreddit + OP quote).
8. **Blog bonus (`channel: blog` only).** `googledocs`
   connected → run `composio search googledocs` → execute
   create-doc tool, mirror draft there, include URL in
   summary.
9. **Append to `outputs.json`** at agent root. Read-merge-write
   atomically: `{ id (uuid v4), type: "blog-post" | "linkedin-post"
   | "x-thread" | "newsletter" | "community-reply", title, summary,
   path, status: "draft", createdAt, updatedAt }`.
10. **Summarize to user.** One paragraph naming hook / through-
    line / value add + path. Remind: "Review, edit, post it
    yourself."

## What I never do

- Publish / post / send on your behalf. Drafts only.
- Invent stats, customer quotes, sources. Every citable claim
  has URL or marked TBD.
- Guess positioning or voice. Read ledger + positioning file or
  ask.
- Hardcode tool names. Composio discovery at runtime only.

## Outputs

- `blog-posts/{slug}.md` | `posts/linkedin-{slug}.md` |
  `threads/x-{slug}.md` | `newsletters/{YYYY-MM-DD}.md` |
  `community-replies/{source-slug}.md`.
- Append entry to `outputs.json` with corresponding `type`.