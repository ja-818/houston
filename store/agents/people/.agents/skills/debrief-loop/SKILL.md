---
name: debrief-loop
description: "Use when you say 'synthesize {candidate}'s panel feedback' / 'hire or no-hire on {candidate}' / 'debrief the loop'  -  aggregates interviewer feedback from Slack, Notion, or paste, extracts themes, surfaces contradictions, scores against rubric, produces hire / no-hire decision memo at `interview-loops/{candidate-slug}-debrief.md`. Recommendation only  -  you decide."
version: 1
tags: [people, debrief, loop]
category: People
featured: yes
image: busts-in-silhouette
integrations: [notion, linear, slack, loops]
---


# Debrief Loop

## When to use

- Explicit: "synthesize {candidate}'s panel feedback", "hire or no-hire on {candidate}", "debrief the loop", "decision memo for {candidate}".
- Prerequisite: ≥2 interviewer feedback blocks exist (appended to loop file, pasted by user, or pulled via connected chat / collab tool).
- One invocation per candidate loop. Append  -  never overwrite  -  prior debriefs.

## Steps

1. **Read people-context doc** at `context/people-context.md`. If missing/empty, tell user: "I need your people context first  -  run the define-people-context skill." Stop. Pull leveling framework for target level, values, hard nos, escalation rules.
2. **Read req.** Open `reqs/{role-slug}.md` for criteria rubric.
3. **Read loop file.** Open `interview-loops/{candidate-slug}.md`. If missing, tell user no loop file exists, stop.
4. **Gather interviewer feedback.** Look for `## Feedback  -  {interviewer}` sections in loop file. If user said feedback lives elsewhere, run `composio search chat` or `composio search collab` to find tool slug and fetch threads / pages user points at. If pasting: accept paste, move on. If nothing available, ask ONE question: "Where's the feedback? I can pull from Slack / Notion / Linear, or you can paste."
5. **Extract themes.** Cluster feedback into:
   - **Strengths**  -  claims multiple panelists agree on.
   - **Concerns**  -  claims multiple panelists agree on.
   - **Contradictions**  -  where panelists disagreed; surface disagreement, propose resolution (reference call, follow-up interview, skip).
   - **UNKNOWNs**  -  rubric criteria nobody covered.
6. **Score against rubric.** Per criterion, aggregate panelist scores where given; fill gaps with "not assessed" where UNKNOWN. Overall band: **hire / borderline / no-hire**.
7. **Produce decision memo.**
   - Recommendation: hire / no-hire.
   - Confidence: low / medium / high  -  and why.
   - Reasoning: 3-5 sentences linking themes + rubric scores.
   - Risks if hire: 2-3 bullets.
   - Risks if pass: 2-3 bullets (e.g. pipeline re-opens, timing).
   - Reference themes to verify  -  3-5 questions for references.
   - **Explicit "Recommendation only  -  founder decides" footer.**
8. **Check escalation rules.** If feedback touches protected-class topics, anti-discrimination concerns, or legal-sensitive matters, STOP memo, surface escalation note pointing to human lawyer per escalation-rules section in context/people-context.md. No recommendation on those grounds.
9. **Write memo.** Append dated `## Debrief  -  {YYYY-MM-DD}` section to `interview-loops/{candidate-slug}.md`. Atomic write (`*.tmp` → rename). Never overwrite prior sections.
10. **Append to `outputs.json`**  -  `{ id, type: "debrief", title, summary, path: "interview-loops/{candidate-slug}.md", status: "draft", createdAt, updatedAt }`, write atomically.
11. **Summarize to user**  -  one paragraph: recommendation, confidence, top reason, top risk, path to memo.

## Never invent

- Never invent interviewer feedback. Panelist didn't weigh in = UNKNOWN.
- Never collapse contradictions into false consensus  -  surface them.
- Never make final hire/fire call; always "Recommendation only".
- Never write under `.houston/<agent>/`.

## Outputs

- `interview-loops/{candidate-slug}.md` (decision memo appended).
- Appends to `outputs.json` with type `debrief`.