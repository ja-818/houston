---
name: evaluate-supplier
description: "Use when you say 'evaluate {supplier}' / 'score these vendors against our criteria' / 'is {supplier} a fit'  -  rubric-based due-diligence with score 1-10, risk tier (green / yellow / red), strengths, concerns, first-call questions, and a recommendation. Writes to `evaluations/{supplier-slug}.md`."
version: 1
tags: [operations, evaluate, supplier]
category: Operations
featured: yes
image: clipboard
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Evaluate Supplier

Supplier due-diligence. Distinct from `run-approval-flow` on this agent  -  this skill procurement-specific (uses supplier rubric, writes to `suppliers/`, runs public signals focused on commercial fit).

## When to use

- "evaluate {supplier} for {product / service}".
- "score these suppliers against our criteria".
- "is {vendor} a fit for {our use case}".
- Called from `run-approval-flow` skill when inbound specifically supplier application.

## Steps

1. **Read `context/operations-context.md`.**
   Vendor posture, hard nos, active priorities. If missing: stop, ask for `define-operating-context`.

2. **Read `config/supplier-rubric.md`.** If missing, use default defined in `data-schema.md` (fit / quality-signals / reference-quality / risk-signals / friction-to-start).

3. **Read `config/procurement.json`**  -  risk appetite + signature authority anchor severity thresholds.

4. **Gather evidence.**
   - **Supplier's own surface**  -  `composio search web-scrape` → pull website, pricing page, docs, case studies.
   - **Public profile**  -  founders, size/stage, notable customers, recent news. Use `composio search research` or `web-search`.
   - **Prior correspondence**  -  `composio search inbox` → search supplier name or domain in founder's inbox.
   - **References you can triangulate**  -  public case studies with identifiable names; flag if any in Key Contacts of operating context.
   - **Compliance quick-check**  -  run `research-compliance` as sub-step for any risk-sensitive supplier (data processors, infrastructure, financial services vendors).
   - **Pricing signal**  -  what discoverable. If behind sales gate, note it.

5. **Score against rubric.** Per criterion:
   - Rating 1-5 (or scale rubric specifies).
   - 1-2 lines evidence with source URLs.
   - Explicit `INSUFFICIENT-EVIDENCE` marker if data not there  -  never guess.

   Compute overall score (weighted sum per rubric) out of 10.

6. **Assign risk tier.**
   - **Green**  -  overall ≥ 8 AND no red flags on risk-signals criterion.
   - **Yellow**  -  overall 6-7.9 OR one material concern.
   - **Red**  -  overall < 6 OR any hard-no violation (data handling, compliance incident, obvious misrepresentation).

7. **Produce output** (save to `suppliers/{supplier-slug}.md`):

   - **Summary**  -  2 sentences: who they are + what they do.
   - **Rubric + scoring table**  -  criterion | rating | evidence (with URLs).
   - **Strengths**  -  3 bullets, most-compelling first.
   - **Concerns**  -  3 bullets, most-material first.
   - **Risk tier**  -  with 1-line reason.
   - **Questions for first call**  -  5-8 tight questions that close evidence gaps and/or expose hidden risk.
   - **Recommendation**  -  `Proceed` / `Pass` / `Get more info` with 3-line rationale.
   - **Founder decision**  -  blank; founder fills in.

8. **Atomic writes**  -  `*.tmp` → rename.

9. **Append to `outputs.json`** with `type: "supplier"`, status "draft" (only founder marks `ready` after deciding).

10. **Summarize to user**  -  tier + overall score + #1 thing founder should resolve before deciding.

## Outputs

- `suppliers/{supplier-slug}.md`
- Appends to `outputs.json` with `type: "supplier"`, status "draft".

## What I never do

- **Contact supplier.** First-call questions for founder. Drafting outreach separate skill (`draft-vendor-outreach`).
- **Commit to decision.** I recommend; founder decides.
- **Score without rubric.** If no rubric exists and founder doesn't provide one, use default and name it in output.