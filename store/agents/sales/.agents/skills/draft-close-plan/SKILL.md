---
name: draft-close-plan
description: "Use when you say 'build a mutual action plan with {Acme}' / 'close plan for {Acme}'  -  I stitch the call analyses into a shared timeline across procurement, security review, budget approval, and legal, with owners (yours + theirs) and dated milestones. Top 3 risks surfaced. Writes to `deals/{slug}/close-plan.md`."
version: 1
tags: [sales, draft, close]
category: Sales
featured: yes
image: handshake
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Draft Close Plan

Mutual action plan (MAP). Share with champion. Drive accountability both ways. Honest version  -  if economic buyer unknown, write UNKNOWN, not "decision maker".

## When to use

- "build a mutual action plan with {Acme}".
- "close plan for {Acme}".
- "what's left to close {Acme}".

## Steps

1. **Read the playbook.** Load `context/sales-context.md`. Need deal stages + qualification to know what still open.

2. **Read call history for the deal.** All `calls/{id}/analysis.md` where `dealSlug` match. Extract confirmed facts vs. inferred.

3. **Compile current state:**

   - **Champion**  -  name + title, or UNKNOWN.
   - **Economic buyer**  -  name + title, or UNKNOWN.
   - **Blocker**  -  if identified, name. Else UNKNOWN.
   - **Procurement path**  -  legal review? InfoSec questionnaire? Finance sign-off? If unknown, UNKNOWN.
   - **Budget**  -  confirmed / in-plan / needs-approval / UNKNOWN.
   - **Technical validation**  -  done / scheduled / required / N/A.
   - **Target close date**  -  from user if provided, else propose based on playbook's typical close cycle.

4. **Draft plan as shared timeline**  -  ours and theirs:

   ```
   Week -4 : [us] Send proposal v2 | [them] Champion aligns with EB
   Week -3 : [them] Legal review / InfoSec | [us] Technical validation call
   Week -2 : [them] Procurement approval | [us] Contract redlines
   Week -1 : [them] Exec sign-off | [us] Final kickoff-ready state
   Week  0 : [both] Contract signed, kickoff scheduled
   ```

   Every row: owner (us / them / both), action, target date, blocker (if any).

5. **Flag UNKNOWNs prominently.** Each UNKNOWN gets bullet in "What we need to learn" section, each assigned to next call with specific question.

6. **Write atomically** to `deals/{slug}/close-plan.md.tmp` → rename. One close plan per deal  -  overwrite prior versions (but keep terse changelog at bottom: "v2  -  2026-04-23: moved close -1w due to legal review").

7. **Update `deals.json`**  -  set `closePlanAt`, `risk` (recompute GREEN/YELLOW/RED based on UNKNOWNs + date slippage).

8. **Append to `outputs.json`:**

   ```json
   {
     "id": "<uuid v4>",
     "type": "close-plan",
     "title": "Close plan  -  {Company}",
     "summary": "Target close {date} · {N} UNKNOWNs · {N} steps.",
     "path": "deals/{slug}/close-plan.md",
     "status": "draft",
     "createdAt": "<ISO>",
     "updatedAt": "<ISO>"
   }
   ```

9. **Summarize.** Target close date + top UNKNOWN user should resolve next. Suggest `prepare-call` for next touch.

## Outputs

- `deals/{slug}/close-plan.md`
- Updates `deals.json`.
- Appends to `outputs.json`.