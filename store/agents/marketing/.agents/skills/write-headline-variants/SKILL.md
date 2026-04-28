---
name: write-headline-variants
description: "Use when you say '10 headlines for {page}' / 'headline variants' / 'alternative hero hooks'  -  I produce 10 headline + subhead pairs for the named page, each grounded in a verbatim customer quote, review line, or positioning-doc claim. No marketer-speak. Top 3 ranked to test first. Writes to `headline-variants/{page-slug}.md`."
version: 1
tags: [marketing, write, headline]
category: Marketing
featured: yes
image: megaphone
integrations: [reddit, firecrawl]
---


# Write Headline Variants

Ten headline variants sound like customer, not marketer. Every variant cite real phrase behind it  -  call quote, review, or positioning-doc line. No quote = no write.

## When to use

- "10 headline variants for my homepage"
- "Alternative hero hooks for the {campaign} landing page"
- "Headline options for the pricing page"
- Often follows `write-page-copy` or Growth & Paid `critique-landing-page` when headline is flagged fix.

## Steps

1. **Read positioning doc** at `context/marketing-context.md`. Missing → tell user run Head of Marketing `define-positioning` first. Stop.
2. **Read `config/voice.md`.** Missing → ask ONE question naming best modality (connected inbox via Composio > paste 2-3 samples). Write before continue.
3. **Identify page + primary conversion.** Read `config/primary-page.json`. User named different page → ask URL / conversion if not obvious. Continue.
4. **Source customer language  -  priority order:**
   - a) `call-insights/`  -  folder exists → read most recent 3-5 files. Extract verbatim pain / desire / trigger phrases.
   - b) `research/`  -  quote banks from research briefs.
   - c) Neither exists → run `composio search` for review-scrape tools (G2, Capterra, Trustpilot, Reddit, App Store). Pull competitor / category reviews. Quote verbatim.
   - d) No review-scrape tool connected → ask user link one category, paste 5-10 customer quotes, or point at review URLs. Stop.
5. **Build quote bank.** 10-20 verbatim phrases, each tagged `pain` / `desire` / `objection` / `trigger` / `positioning-doc`. Cite source (call ID / review platform + URL / positioning line).
6. **Generate variants.** 10 headline + subhead pairs. For each:
   - Headline (founder voice, grounded in specific quote from bank  -  name quote tag).
   - Subhead  -  1-2 lines expanding headline with specificity.
   - Angle label  -  one of: outcome-over-feature, problem-framed, "without X", contrarian, urgency, social-proof-led, category-definition, transformation, question-hook, numeric.
   Respect page length constraints (hero ~<12 words, meta titles ~60 chars)  -  ask if unclear.
7. **Rank top 3 to test first.** Rank by: (a) strength of source quote (frequency / pain intensity), (b) alignment with positioning doc primary claim, (c) contrast with current page copy. Name headline kept as control + 3 challengers.
8. **Hand-off hooks.** Top variant needs formal A/B test → name Growth & Paid `design-ab-test`. Needs CTA work → name `write-cta-variants` as next step.
9. **Write** atomically to `headline-variants/{page-slug}-{YYYY-MM-DD}.md` (`*.tmp` → rename). Quote bank first, then variants with source quote next to each.
10. **Append to `outputs.json`**  -  `{ id, type: "headline-variants", title, summary, path, status: "draft", createdAt, updatedAt }`.
11. **Summarize to user**  -  top 3 variants to test, pain each addresses, path to full file.

## Never invent

Can't point headline at specific quote or positioning-doc line → don't write. Marketer-speak ("Revolutionary AI-powered platform") goes in bin.

## Outputs

- `headline-variants/{page-slug}-{YYYY-MM-DD}.md`
- Appends to `outputs.json` with `type: "headline-variants"`.