---
name: debrief-candidate-s-loop-hire-or-no-hire
description: "Aggregates interviewer feedback from Slack or Notion, extracts themes, surfaces contradictions, scores against the rubric, and drafts a hire / no-hire memo. You decide."
version: 1
tags: ["people", "overview-action", "debrief-loop"]
category: "Hiring"
featured: yes
integrations: ["notion", "linear", "slack", "loops"]
image: "busts-in-silhouette"
inputs:
  - name: candidate
    label: "Candidate"
  - name: candidate_slug
    label: "Candidate Slug"
    required: false
prompt_template: |
  Debrief {{candidate}}'s interview loop. Use the debrief-loop skill. Pull interviewer feedback from my connected Slack channel (or Notion / paste fallback), extract themes, surface contradictions across panelists, score against the rubric, and produce a hire / no-hire decision memo at interview-loops/{{candidate_slug}}-debrief.md. Recommendation only  -  I decide.
---


# Debrief {candidate}'s loop  -  hire or no-hire?
**Use when:** Themes, contradictions, rubric score, decision memo.
**What it does:** Aggregates interviewer feedback from Slack or Notion, extracts themes, surfaces contradictions, scores against the rubric, and drafts a hire / no-hire memo. You decide.
**Outcome:** Debrief memo at interview-loops/{slug}-debrief.md with recommendation + rationale.
## Instructions
Run this as a user-facing action. Use the underlying `debrief-loop` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Debrief {candidate}'s interview loop. Use the debrief-loop skill. Pull interviewer feedback from my connected Slack channel (or Notion / paste fallback), extract themes, surface contradictions across panelists, score against the rubric, and produce a hire / no-hire decision memo at interview-loops/{candidate-slug}-debrief.md. Recommendation only  -  I decide.
```
