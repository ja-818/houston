---
name: prep-interviewer
description: "Use when you say 'prep me to interview {candidate}' / 'what should I ask {candidate}' / 'interview brief for {candidate}'  -  builds the interviewer-side brief: background summary, likely questions, red flags to probe, reference themes, scoring rubric. Writes to `interview-loops/{candidate-slug}.md`. Flipped from candidate-side prep  -  this is for you."
version: 1
tags: [people, prep, interviewer]
category: People
featured: yes
image: busts-in-silhouette
integrations: [notion, linkedin, loops]
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Prep Interviewer

## When to use

- Explicit: "prep me to interview {candidate}", "what should I ask {candidate}", "interview brief for {candidate}", "brief me for {candidate} loop".
- Implicit: called as dependency by `coordinate-interviews`  -  every panelist needs tailored brief.
- One invocation = one interviewer-side brief. Panel briefing? Call per interviewer via `coordinate-interviews`.

## Steps

1. **Read people-context doc** at `context/people-context.md`. Missing/empty? Tell user: "I need your people context first  -  run the define-people-context skill." Stop. Pull leveling framework, values, escalation rules.
2. **Read req.** Open `reqs/{role-slug}.md` for criteria rubric. Missing? Ask ONE targeted question, write it.
3. **Read candidate record.** Open `candidates/{candidate-slug}.md`. Missing? Tell user: "No record for {candidate}. Run `screen-resume` or `score-candidate` first so I have something to brief from." Stop.
4. **Read existing loop file** if present at `interview-loops/{candidate-slug}.md`  -  avoid duplicating questions assigned to other panelists.
5. **Ask for interviewer focus** if not stated  -  ONE question: "Who's conducting the interview and what's their focus area (e.g. technical, systems, leadership, values)?" Scopes which rubric criteria interviewer owns.
6. **Build brief.** Structure:
   - **Candidate background summary**  -  3-5 sentences from candidate record. No invention; cite source per claim (screen / LinkedIn / sourcing signal).
   - **This interviewer's focus areas**  -  2-3 rubric criteria they own for loop.
   - **6-10 likely questions** scoped to focus areas, each with one-line "what strong answer looks like".
   - **3-5 red flags to probe**  -  from candidate record's red-flag list. Include question to surface each flag.
   - **Reference themes**  -  topics for future reference call (if loop progresses).
   - **Scoring rubric**  -  per question: 0-3 bar with exemplars, tied to people-context leveling framework for this level.
7. **Write to `interview-loops/{candidate-slug}.md`.** Append new dated `## Interviewer brief  -  {interviewer name}  -  {YYYY-MM-DD}` section  -  never overwrite. File missing? Create with header stub then brief section. Atomic write (`*.tmp` → rename).
8. **Append to `outputs.json`**  -  `{ id, type: "interview-prep", title, summary, path: "interview-loops/{candidate-slug}.md", status: "draft", createdAt, updatedAt }`, write atomically.
9. **Summarize to user**  -  one paragraph: interviewer named, focus areas, top 3 questions, path to loop file.

## Never invent

- Every candidate claim in background summary must trace to candidate record. UNKNOWN there = UNKNOWN here.
- Never draft questions probing protected-class attributes.
- Never generate candidate-side prep (what candidate should say)  -  this skill interviewer-side only.

## Outputs

- `interview-loops/{candidate-slug}.md` (appended; created if missing).
- Appends to `outputs.json` with type `interview-prep`.