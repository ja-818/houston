---
name: run-trademark-search
description: "Use when you say 'knockout search on {mark}' / 'is {name} available' / 'trademark clearance'  -  I search USPTO Trademark Center (Jan 2025 platform) for exact hits, phonetic variants, and visual variants in the relevant Nice classes, return a risk assessment (Low / Medium / High) and recommended next step to `tm-searches/{mark-slug}-{YYYY-MM-DD}.md`. Honest about knockout-vs-clearance limits  -  a real clearance is attorney work."
version: 1
tags: [legal, run, trademark]
category: Legal
featured: yes
image: scroll
integrations: [firecrawl]
---


# Run Trademark Knockout

Not clearance opinion  -  knockout. Knockout answer "obvious blocker?" Not "safe to register?" Second question need TM counsel.

## When to use

- "Run knockout on {mark}."
- "Is {name} available as trademark?"
- Before any spend on branding, domain, logomark.
- Before filing 1(b) intent-to-use application.

## Steps

1. **Read shared context.** Read `context/legal-context.md`. If missing or empty, respond:
   > "I need the shared legal context first  -  please run General
   > Counsel's `define-legal-context` skill, then come back."
   Stop. No proceed.

2. **Confirm mark + classes.** Founder give:
   - Proposed **word mark** (design element / logo separate if relevant  -  design marks need own search).
   - **Nice classes** they want. Most SaaS founders = **Class 9** (software / downloadable apps) + **Class 42** (SaaS / platform-as-a-service). Branded consumer hardware add **Class 35** (retail services) or product class. Founder unsure → propose 9 + 42, confirm.

   Write `config/trademark-prefs.json` with `{ classes, lastSearchedAt }` if first-time.

3. **Run knockout vs USPTO Trademark Center.** Run `composio search uspto` or `composio search trademark` for tool slug; USPTO Trademark Center (launched Jan 2025) = canonical system. No connected tool → run `composio search web-scrape` and query `https://tmsearch.uspto.gov/` direct.

   Four passes per class:

   - **Exact-word pass**  -  `mark` as wordmark.
   - **Phonetic pass**  -  phonetic equivalents (Kandi vs Candy, Fone vs Phone, Noot vs Newt, etc.).
   - **Visual pass**  -  letter-swap / transliteration (Lyft vs Lift, Tumblr vs Tumbler).
   - **Root-word pass**  -  search root if mark compound (e.g. "BrightCloud" → search "Bright" and "Cloud").

4. **Classify each hit.** Per result capture: serial number, full mark, owner, goods/services description, class, filing date, status (`LIVE` / `PENDING` / `ABANDONED` / `DEAD`). LIVE or PENDING hit in overlapping class = blocker. ABANDONED or DEAD = informational (still possible common-law mark issue, not registration blocker).

5. **Assess risk.**
   - **High**  -  exact or phonetic LIVE/PENDING hit, same class. Or LIVE/PENDING hit with near-identical goods description.
   - **Medium**  -  exact LIVE/PENDING hit in adjacent class (e.g. want Class 42 SaaS; Class 9 software hit exists). Or phonetic/visual LIVE/PENDING hit, same class. Or many ABANDONED hits = crowded field.
   - **Low**  -  no LIVE/PENDING hits in target or adjacent classes; few ABANDONED/DEAD hits, or wholly different goods.

6. **Recommend next step.**
   - Low → file **1(b) intent-to-use** once mark locked, or keep using and file 1(a) once in commerce. USPTO fee ~$350/class on TEAS Plus.
   - Medium → **retain TM counsel for full clearance** before filing; coexistence strategies possible.
   - High → **rebrand**, or retain TM counsel for coexistence / consent agreements. No file.

7. **Write atomically** to `tm-searches/{mark-slug}-{YYYY-MM-DD}.md` with:
   - Mark + classes searched + search timestamp.
   - Risk assessment + one-line rationale.
   - Hit table (exact pass, phonetic pass, visual pass, root pass) with serial number, mark, owner, class, status.
   - Recommended next step.
   - **Limits disclosure**  -  verbatim: "This is a knockout search, not a full clearance. It covers USPTO federal registrations only. It does not cover state registrations, common-law marks, foreign marks, or domain/social-handle availability. For High-risk results or pre-filing, retain TM counsel."

8. **Append to `outputs.json`**  -  `{ id, type: "tm-search", title, summary, path, status: "ready", createdAt, updatedAt, attorneyReviewRequired }`. Flip `attorneyReviewRequired: true` on any **High** risk (always) and any **Medium** risk founder intend to proceed with.

9. **Summarize to user**  -  risk rating, single highest-risk hit (serial + owner + class), recommended next step, path to full report.

## Outputs

- `tm-searches/{mark-slug}-{YYYY-MM-DD}.md`
- Appends to `outputs.json` with `type: "tm-search"`.