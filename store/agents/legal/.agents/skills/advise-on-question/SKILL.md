---
name: advise-on-question
description: "Use when you ask 'do I need X?' / 'does GDPR apply to us?' / 'is this OK?'  -  I write a short advice memo structured as Question → Short answer → Context → Sources cited → Next move, with a judgment-call disclaimer at the end. Writes to `advice-memos/{topic-slug}-{YYYY-MM-DD}.md`. Never renders final legal advice  -  if the matter is non-routine I flag it and recommend `draft-document` type=escalation-brief."
version: 1
tags: [legal, advise, on]
category: Legal
featured: yes
image: scroll
integrations: [stripe]
---


# Advise on Legal Question

## When to use

- "do I need an NDA with investors?"  -  typically no, pitch-stage investors refuse.
- "do I need a DPA with {vendor}?"  -  depends on data + region.
- "does GDPR apply to me?"  -  depends on EU visitors/customers + data.
- "can I use this customer logo on my landing page?"  -  depends on MSA marketing rights clause.
- "do I need to file an 83(b)?"  -  probably yes, within 30 days of stock issuance. Hard deadline.
- Any "do I need X?" or "does X apply?" fits short memo.

## Steps

1. **Read shared context.** Load `legal-context.md` for entity, data geography of current users, standing agreements, founder risk posture, escalation rules. Also read relevant prior `advice-memos/` entries  -  don't re-answer decided stuff.

2. **Clarify question (at most one follow-up).** If question hinges on fact not in context, ask ONE targeted question with best-modality hint. Examples:
   - "Does GDPR apply?" → "Analytics on landing page + EU visitors? Connected Plausible / GA / Fathom via Composio answers in 30s."
   - "Do I need DPA with {vendor}?" → "What data {vendor} touch  -  customer PII, payment data, employee data, or own company docs?"
   Don't ask more than one. Broad question → scope it ("narrow to {subquestion}").

3. **Research if needed.** For questions citing regulations, checklists, market standards, use `composio search web-search` (or similar  -  discover at runtime) to pull authoritative sources: primary statute/regulation text, EDPB / IRS / SEC / USPTO guidance, reputable founder-legal checklists (Capbase, Andrew Bosin, Promise Legal, YC, Common Paper). Cite every source inline. No "probably" hedges  -  state or mark UNKNOWN.

4. **Draft memo (~200-400 words, direct, verb-led).** Structure:

   1. **Question**  -  founder's question in one sentence, verbatim if possible.
   2. **Short answer**  -  one paragraph. First sentence = bottom line ("Yes", "No", "It depends  -  here's rule"). No hedging. If depends, state two or three forks + what decides between.
   3. **Context**  -  one paragraph: why applies to this founder. Reference entity (Delaware C-corp), stage (week 0, pre-revenue / one customer), stack (Stripe, Google Workspace), any relevant standing agreement or data geography.
   4. **Sources cited**  -  bulleted. Each with one-line why-it-matters. Primary statute > regulator guidance > reputable checklist. 2-5 sources, no Wikipedia.
   5. **Next move**  -  one concrete action. Examples: "Draft DPA via Paralegal `draft-document`", "Add to `compliance-ops` subprocessor inventory", "File 83(b) within {N} days  -  Compliance Ops tracks on deadline calendar".
   6. **Judgment-call disclaimer**  -  "This is a judgment call; not final legal advice. Escalate via `draft-document` (type=escalation-brief) if {specific condition  -  e.g. data is health-related, EU customer is regulated entity, deal over $100K}."

5. **Flag `attorneyReviewRequired: true`** if question touches:
   - HIPAA, PCI-DSS, COPPA, biometrics, export controls.
   - International data transfers with non-standard mechanism.
   - Tax treatment decisions (QSBS eligibility, 83(b) filing mechanics beyond deadline itself, R&D credit).
   - Securities offerings beyond standard SAFE / priced round.
   - Employment law beyond at-will / offer-letter / CIIAA trio.
   - Anything criminal, regulatory enforcement, or litigation-adjacent.

6. **Write atomically** to `advice-memos/{slug}-{YYYY-MM-DD}.md`  -  `{path}.tmp` then rename. Slug = short kebab-case of question (e.g. `gdpr-applies-to-landing-page`, `do-i-need-nda-with-investors`, `dpa-with-stripe`).

7. **Append to `outputs.json`.** Read-merge-write atomically:

   ```json
   {
     "id": "<uuid v4>",
     "type": "advice-memo",
     "title": "Advice  -  <question short form>",
     "summary": "<2-3 sentences  -  the bottom line + the next move>",
     "path": "advice-memos/<slug>-<YYYY-MM-DD>.md",
     "status": "ready",
     "attorneyReviewRequired": <true | false>,
     "createdAt": "<ISO-8601>",
     "updatedAt": "<ISO-8601>"
   }
   ```

   (Advice memos ship as `ready`  -  factual + cited; founder decides whether to act, not whether to approve draft.)

8. **Summarize to user.** One paragraph: bottom line, next move, whether attorney review required. Drop path to memo.

## Outputs

- `advice-memos/{slug}-{YYYY-MM-DD}.md`
- Appends to `outputs.json` with `type: "advice-memo"`.