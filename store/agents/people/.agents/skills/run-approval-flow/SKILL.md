---
name: run-approval-flow
description: "Use when you say 'review this {PTO / comp / promotion / expense} request' / 'approve this ask' / 'should we {X}'  -  reads the approval rubric from `context/people-context.md`, evaluates the request, classifies it as approved / escalate / denied with reasoning, and produces an escalation note for out-of-rubric asks. Writes to `approvals/{request-slug}.md`."
version: 1
tags: [people, run, approval]
category: People
featured: yes
image: busts-in-silhouette
integrations: [notion, slack]
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Run Approval Flow

## When to use

- Explicit: "review this {PTO / comp / promotion / expense} request", "approve this ask", "should we {X}", "run approval check on {request}".
- Implicit: routed from helpdesk channel when team member files request needing rubric check.
- Frequency: per request.

## Steps

1. **Read people-context doc.** Read `context/people-context.md` for relevant rubric section  -  PTO policy, comp bands by level, promotion criteria, expense thresholds, escalation rules (who out-of-rubric note routes to). If missing/empty, tell user: "I need your people-context doc first  -  run define-people-context skill." Stop.
2. **Read config.** `config/context-ledger.json` (HRIS) for HRIS data needed to contextualize request (employee level for comp checks, tenure for PTO accrual, manager chain for promotion). HRIS read-only.
3. **Parse request.** Extract: requester (employee-slug), request type (PTO / comp / promotion / expense / other), amount / dates / scope, justification if provided. If required field missing, ask ONE targeted question.
4. **Evaluate against rubric.** Walk each rubric criterion, record PASS / FAIL / N/A with one-line reason tied to exact rubric clause (e.g. "PASS  -  within band range for L3 per people-context § Comp bands").
5. **Classify** into one of three buckets:
   - **Approved**  -  all required criteria PASS. Draft short approval note.
   - **Escalate**  -  request out of band (comp delta beyond band, PTO beyond policy, promotion outside cycle, expense over threshold) OR rubric silent. Draft escalation note routing to named human per escalation rules  -  never approve out-of-rubric request without surfacing exception for founder sign-off.
   - **Denied**  -  one or more criteria FAIL with clear "not permitted" in rubric. Draft denial reasoning in plain, non-hedging language  -  cite clause.
6. **Write** decision memo atomically to `approvals/{request-slug}.md` (`*.tmp` → rename). Include: classification bucket at top, full PASS/FAIL walk of rubric criteria, reasoning, drafted reply or escalation note. Never send  -  founder sends after sign-off.
7. **Append to `outputs.json`**  -  read existing array, add `{ id, type: "approval", title, summary, path, status: "draft", createdAt, updatedAt }`. Summary leads with classification bucket. Write atomically.
8. **Summarize to user**  -  one paragraph: classification, one-sentence reason, path to memo.

## Never

- Never auto-approve out-of-rubric request to be "helpful." Escalate every exception.
- Never deny on vibes. Every denial cites specific rubric clause.
- Never modify HRIS records. Reads only.
- Never send reply directly  -  founder sends after review.

## Outputs

- `approvals/{request-slug}.md` (classification + reasoning + draft reply or escalation note).
- Appends to `outputs.json` with type `approval`, classification bucket in summary.