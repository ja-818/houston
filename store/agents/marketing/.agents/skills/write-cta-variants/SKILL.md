---
name: write-cta-variants
description: "Use when you say 'better CTA' / 'CTA variants for {button}'  -  I write CTA button copy variants, each paired with the objection it answers (e.g. 'Start free  -  no credit card required'). Grounded in pains from your call insights. Writes to `cta-variants/{page-slug}.md`."
version: 1
tags: [marketing, write, cta]
category: Marketing
featured: yes
image: megaphone
---


# Write CTA Variants

CTA copy = small surface, big leverage. Each variant answer specific objection from positioning doc + name outcome founder actually deliver.

## When to use

- "Better CTA for my signup button"
- "CTA variants for the pricing page"
- "What should the demo button say?"
- Often follow `write-headline-variants` or `edit-copy` when CTA flagged weak.

## Steps

1. **Read positioning doc** at `context/marketing-context.md`. If missing, tell user run Head of Marketing's `define-positioning` first + stop. Positioning doc = where objections live.
2. **Read `config/voice.md`.** If missing, ask ONE question naming best modality (connected inbox via Composio > paste 2-3 samples) + write before continuing.
3. **Read `config/primary-page.json`** for primary conversion event. If user named different button / conversion, accept + continue.
4. **Identify surface.** Ask (if unclear) ONE question: which button, which page, which step in flow. Short paste okay.
5. **List objections.** Pull top 3-5 objections from positioning doc (or `call-insights/` if present). If objections undocumented, ask user top 2 ("What makes visitors hesitate on this button?") + note in output as "founder-flagged".
6. **Draft 5-7 CTA variants.** Each:
   - Exact button text (short  -  2-5 words).
   - Objection it answers (named from list above).
   - Implied outcome (what user get on click).
   - Angle: action-led, outcome-led, risk-reversal, social-proof, micro-commitment, specificity-led, urgency.
   Never: "Submit", "Click Here", "Learn More", "Get Started" without object.
7. **Rank top 2 to test first.** Based on which objection most common in evidence + which outcome positioning doc most support.
8. **Flag supporting copy.** Note if CTA need trust line below ("No credit card required" / "Cancel anytime") + whether copy tie to real policy (don't invent).
9. **Hand-off hooks.** If top variants need A/B test, name Growth & Paid's `design-ab-test`.
10. **Write** atomically to `cta-variants/{page-slug}-{YYYY-MM-DD}.md` (`*.tmp` → rename).
11. **Append to `outputs.json`**  -  `{ id, type: "cta-variants", title, summary, path, status: "draft", createdAt, updatedAt }`.
12. **Summarize to user**  -  top 2 CTAs, objection each answer, path to full file.

## Never

- Invent trust lines ("No credit card required" only if true).
- Use generic CTAs without object.
- Promise outcomes product no deliver.

## Outputs

- `cta-variants/{page-slug}-{YYYY-MM-DD}.md`
- Appends to `outputs.json` with `type: "cta-variants"`.