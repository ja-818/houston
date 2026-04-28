---
name: run-approval-flow
description: "Use when you say 'review this inbound' / 'score this {vendor / partnership / advisor / press} application against our criteria'  -  I apply a rubric from your operating context to produce a scored approve / decline / more-info recommendation with evidence per criterion. Writes to `approvals/{kind}-{slug}.md`."
version: 1
tags: [operations, run, approval]
category: Operations
featured: yes
image: clipboard
---


# Run Approval Flow

Generic approval-rubric runner for any inbound needing founder decision. Vendor-specific supplier triage → Vendor agent `evaluate-supplier` skill (procurement criteria, different folder).

## When to use

- "review this vendor application against our criteria" (supplier-specific → Vendor agent `evaluate-supplier`).
- "score these advisor candidates".
- "is this partnership a fit".
- "should I accept this press request".
- "run the approval flow on this".

## Steps

1. **Read `context/operations-context.md`.** Active priorities, hard nos, founder-specific positions anchor every rubric eval. Missing → `define-operating-context` first, stop.

2. **Read `config/approval-rubrics.md`.** Map inbound-type to rubric. Missing file or no matching rubric → ask founder: "What criteria should I use? Paste them, or I can save a default rubric for {inbound-type} you can edit later."

   **Default rubrics** (used if founder says "default"):

   - **vendor-app** (generic inbound vendor / seller): fit-to-priorities, size/stage-match, red-flags-search (public incidents), reference-check (Y/N), friction-to-try.
   - **advisor**: domain-authority, access (who they'd open), time-commitment, compensation-alignment.
   - **partnership**: mutual-audience, mutual-capability, asymmetric-upside (do they need us more than we need them), off-ramp-cost.
   - **press**: audience-fit, question-quality, founder-time-cost, reputational-upside.

3. **Gather evidence.**
   - Read submission founder pastes or links.
   - `composio search research` → public signals on submitter (website, recent activity, mentions).
   - `composio search inbox` → prior correspondence with person or domain.
   - Submission claims verifiable → verify (e.g. "raised Series B last month" → quick news check).

4. **Score against rubric.**
   - Each criterion: rating (1-5 or green/yellow/red per rubric) + 1-2 lines evidence. Cite links.
   - Overall: weighted sum if rubric specifies weights; else rolled-up qualitative call.

5. **Produce recommendation.**
   - **Approve**  -  fit + no red flags + strong evidence.
   - **Decline**  -  clear mismatch or red flags; state top 2 reasons.
   - **More info**  -  on the fence; list 2-3 specific questions founder should ask to break tie.

6. **Write** to `approvals/{slug}.md` with:
   - Submission summary (1 paragraph).
   - Rubric + scoring table (criterion | rating | evidence).
   - Public-signal findings.
   - Prior-correspondence summary (if any).
   - Recommendation + 3-line rationale.
   - If "more info", exact follow-up questions.

7. **Atomic writes**  -  `*.tmp` → rename.

8. **Append to `outputs.json`** with `type: "approval"`, status "draft" (founder marks `ready` after deciding).

9. **Summarize to user**  -  recommendation + one most load-bearing line of evidence. Never "approve" without naming #1 thing that would make founder regret it.

## Outputs

- `approvals/{slug}.md`
- Appends to `outputs.json` with `type: "approval"`, status "draft".

## What I never do

- **Commit the decision.** I recommend; founder approves/declines.
- **Send acknowledgement or rejection email to submitter.** That `draft-reply`'s job after founder decides.
- **Use rubric not stored.** Asked to score without rubric → ask for one first. Ad-hoc scoring not reproducible.