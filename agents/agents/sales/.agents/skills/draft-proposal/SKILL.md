---
name: draft-proposal
description: "Use when you say 'draft a proposal for {Acme}' / 'one-pager proposal for {Acme}' — I read the deal history across all call notes, lift their verbatim problem statement and success metric, and draft the one-pager (problem → approach → scope in + out → pricing within your playbook's stance → terms → success metrics → timeline → next step). Any exception to the pricing stance gets flagged for your approval. Writes to `deals/{slug}/proposal-v{N}.md`."
---

# Draft Proposal

One-pager proposal. Not SOW — tight, one-page doc champion forward to economic buyer + procurement.

## When to use

- "draft a proposal for {Acme}".
- "one-pager proposal for {Acme}".
- "I need to send {Acme} a quote / scope".

## Steps

1. **Read the playbook.** Load `context/sales-context.md`. Required. Without it, stop.

2. **Read pricing.** From playbook pricing-stance section. Know bands, discount policy, non-negotiable. **Never draft below non-negotiable.** If deal need that, write UNKNOWN + flag for approval.

3. **Read deal history** — all call notes + analyses under `calls/` filtered by `dealSlug`. Extract: problem statement (verbatim), success metric (verbatim), stakeholders, timeline.

4. **Draft proposal (~300–450 words):**

   1. **Problem statement** — THEIR words, cite which call.
   2. **Proposed approach** — one paragraph, concrete. No buzzwords.
   3. **Scope** — in: bulleted. Explicitly OUT: bulleted. Out-of-scope list important as in — prevents scope creep.
   4. **Pricing** — proposed band, assumptions (user count, volume, term), any discount applied (within policy). Show math.
   5. **Terms** — minimum viable terms from playbook, adjusted only within discount policy.
   6. **Success metrics** — how both know worked. Pulled from call notes; metric they told us mattered.
   7. **Timeline** — kickoff, value-in-{N}-weeks milestones.
   8. **Next step** — who signs, who legal-reviews, target close date (from `close-plan.md` if exists).

5. **Sanity-check vs playbook.** Any commitment outside pricing stance or terms flagged inline with `FLAG: needs approval — exceeds {non-negotiable}`. Surface to user in summary, not buried.

6. **Versioning.** If prior proposal exists, increment version. First draft = `proposal-v1.md`; next = `v2.md`. Never overwrite.

7. **Write atomically** to `deals/{slug}/proposal-v{N}.md.tmp` → rename.

8. **Update `deals.json`** — set `lastProposalAt`, `proposalVersion`.

9. **Append to `outputs.json`:**

   ```json
   {
     "id": "<uuid v4>",
     "type": "proposal",
     "title": "Proposal v{N} — {Company}",
     "summary": "<scope one-liner + pricing band>",
     "path": "deals/{slug}/proposal-v{N}.md",
     "status": "draft",
     "createdAt": "<ISO>",
     "updatedAt": "<ISO>"
   }
   ```

10. **Summarize.** Pricing ask + flags need user decision. Path to full proposal. Never send.

## Outputs

- `deals/{slug}/proposal-v{N}.md`
- Updates `deals.json`.
- Appends to `outputs.json`.