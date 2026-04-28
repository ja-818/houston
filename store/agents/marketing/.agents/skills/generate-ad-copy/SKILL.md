---
name: generate-ad-copy
description: "Use when you say 'draft ad copy' / 'write ad variants' / 'give me 10 ad headlines'  -  I pull phrases from your call insights (or G2 / Capterra / Trustpilot reviews via scrape) and write headlines + descriptions that sound like your customers talking  -  not a marketer pitching. Writes to `ad-copy/{campaign}.md` with the source quote alongside each headline."
version: 1
tags: [marketing, generate, ad]
category: Marketing
featured: yes
image: megaphone
integrations: [linkedin, reddit, firecrawl]
---


# Generate Ad Copy

Ad copy sound like customer, not marketer. Every headline derive from real phrase  -  either sales-call quote Head of Marketing captured, or competitor review mined via Composio. Marketer-speak rejected.

## When to use

- "Draft 10 ad copy variants for {product}"
- "Write Google search headlines for {keyword}"
- "Give me Meta creative for the {campaign} launch"
- Follows `plan-paid-campaign` (hand-off: "For copy, run
  `generate-ad-copy` on this campaign's angles").

## Steps

1. **Read positioning doc** at `context/marketing-context.md`. If missing, tell user run Head of Marketing `define-positioning` first and stop.
2. **Read config:** `config/channels.json` (format constraints vary by channel  -  Google RSA vs. Meta vs. LinkedIn). No channel named, ask which platform in one question.
3. **Source customer language  -  priority order:**
   - a) `call-insights/`  -  if folder exists, read most recent 3-5 files and extract verbatim pain / desire quotes.
   - b) `research/`  -  quote banks from research.
   - c) Neither exists, run `composio search` for review-scrape tools (G2, Capterra, Trustpilot, Reddit, App Store) and pull competitor / category reviews. Quote verbatim.
   - d) No review-scrape tool connected, ask user link one category, or paste 5-10 customer quotes, and stop.
4. **Build quote bank.** 10-20 verbatim phrases, each tagged `pain` / `desire` / `objection` / `trigger`. Cite source (call ID / review platform / URL).
5. **Generate variants.** For named campaign / angle, produce:
   - **Headlines**  -  10 variants, each grounded in specific quote (cite quote tag next to each). Respect platform char limits (Google RSA 30; Meta primary ~40; LinkedIn ~70).
   - **Descriptions**  -  5 variants, same grounding rule.
   - **CTAs**  -  5 variants.
   - **Creative concepts** (for visual placements)  -  3 short briefs (image direction + overlay text), each tied to angle.
6. **Rank** variants by hypothesis strength: which quote strongest pain, which angle positioning doc most supports. Name top 3 to test first.
7. **Write** atomically to `ad-copy/{campaign-slug}.md` (`*.tmp` → rename). Format: quote bank first, then variants with source quote next to each.
8. **Append to `outputs.json`**  -  `{ id, type: "ad-copy", title, summary, path, status: "draft", createdAt, updatedAt }`. Merge, atomic write.
9. **Summarize to user**  -  top 3 variants to test, pain they address, path to full file.

## Never invent

Can't point headline at specific quote, don't write it. Marketer-speak ("Revolutionary AI-powered platform") goes in bin.

## Outputs

- `ad-copy/{campaign-slug}.md`
- Appends to `outputs.json` with `type: "ad-copy"`.