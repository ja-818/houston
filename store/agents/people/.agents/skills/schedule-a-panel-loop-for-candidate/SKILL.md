---
name: schedule-a-panel-loop-for-candidate
description: "Proposes times via Google Calendar or Outlook (free/busy, never sends), runs prep-interviewer per panelist, and appends everything to interview-loops/{slug}.md. You approve and send."
version: 1
tags: ["people", "overview-action", "coordinate-interviews"]
category: "Hiring"
featured: yes
integrations: ["googlecalendar", "outlook", "loops"]
image: "busts-in-silhouette"
inputs:
  - name: candidate
    label: "Candidate"
  - name: candidate_slug
    label: "Candidate Slug"
    required: false
prompt_template: |
  Schedule {{candidate}}'s interview loop. Use the coordinate-interviews skill. Propose times via my connected Google Calendar (check free/busy, never send the invites), run the prep-interviewer skill per panelist, and append schedule + briefs to interview-loops/{{candidate_slug}}.md. I approve and send.
---


# Schedule a panel loop for {candidate}
**Use when:** Free/busy via Google Calendar, briefs per panelist.
**What it does:** Proposes times via Google Calendar or Outlook (free/busy, never sends), runs prep-interviewer per panelist, and appends everything to interview-loops/{slug}.md. You approve and send.
**Outcome:** Schedule + per-panelist briefs at interview-loops/{slug}.md. You click send.
## Instructions
Run this as a user-facing action. Use the underlying `coordinate-interviews` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Schedule {candidate}'s interview loop. Use the coordinate-interviews skill. Propose times via my connected Google Calendar (check free/busy, never send the invites), run the prep-interviewer skill per panelist, and append schedule + briefs to interview-loops/{candidate-slug}.md. I approve and send.
```
