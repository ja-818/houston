---
name: prep-me-to-interview-candidate
description: "Builds an interviewer-side brief: background, likely questions, red flags to probe, reference themes, scoring rubric - flipped from candidate-side prep."
version: 1
tags: ["people", "overview-action", "prep-interviewer"]
category: "Hiring"
featured: yes
integrations: ["notion", "linkedin", "loops"]
image: "busts-in-silhouette"
---


# Prep me to interview {candidate}
**Use when:** Background, likely questions, red flags, rubric.
**What it does:** Builds an interviewer-side brief: background, likely questions, red flags to probe, reference themes, scoring rubric  -  flipped from candidate-side prep.
**Outcome:** Brief at interview-loops/{candidate-slug}.md  -  open it 5 minutes before the call.
## Instructions
Run this as a user-facing action. Use the underlying `prep-interviewer` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Prep me to interview {candidate} for the {role} role. Use the prep-interviewer skill. Read the candidate record at candidates/{candidate-slug}.md (or run evaluate-candidate first if missing), pull the rubric from reqs/{role-slug}.md, and build an interviewer-side brief: background summary, likely questions, red flags to probe, reference themes, scoring rubric. Write to interview-loops/{candidate-slug}.md.
```
