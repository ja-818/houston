---
name: plan-roadmap
description: "Use when you say 'draft the Q{n} roadmap' / 'what's our top 3 this quarter'  -  I read the engineering context + every artifact in this agent's `outputs.json`, pick the top 3 priorities, size each S/M/L, state the rationale, and list dependencies. Markdown, not a Gantt. Writes to `roadmaps/q{n}-{year}.md` ready to paste to the team or share with investors."
version: 1
tags: [engineering, plan, roadmap]
category: Engineering
featured: yes
image: laptop
integrations: [github, linear, jira]
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Plan Roadmap

Quarterly roadmap. Markdown, not Gantt. Force solo founder write down "in my head" so Backlog & Triage and Tech Lead plan against it.

## When to use

- "draft the Q{n} roadmap" / "what's our top 3 this quarter" / "plan the next quarter".
- "update the roadmap  -  we just learned {X}".
- After `validate-feature-fit` flips feature to "go", founder asks "where does this fit on the roadmap?"

## Steps

1. **Read engineering-context.md** (own file). If missing, STOP  -  tell user run `define-engineering-context` first. Roadmap without context = wish-listing.

2. **Read priorities from config.** Load `config/priorities.md` for baseline founder captured at onboarding.

3. **Cross-check in-flight work.** Read each peer agent's `outputs.json` (read-only; handle missing gracefully):
   - `outputs.json`  -  open design docs + high-risk PRs.
   - `outputs.json`  -  incidents + runbook gaps pulling attention.
   - `outputs.json`  -  active sprints + top-scored tickets.
   - `outputs.json`  -  DX audits flagging friction.

   If agent not installed, note `(no activity)` and continue.

4. **Gather roadmap inputs**  -  ask ONE tight question if any missing (best modality hint first):
   - **Quarter**  -  `Q{n}-{year}`. (Best: paste.)
   - **Quarter goal**  -  one outcome defining successful quarter. (Best: paste.)
   - **Recent feature-fit verdicts**  -  read `feature-fit/` if present; prefer fresh "go" calls for top 3.

5. **Pick top 3 priorities.** No more, no fewer. Each must:
   - Ladder to quarter goal.
   - Sized S / M / L (S = 1-2 weeks, M = ~1 month, L = ~2 months for solo-founder pace).
   - State **why now** (rationale  -  market signal, user pain, platform debt)  -  cite evidence (feature-fit doc, incident, call insight, competitor move).
   - Name **dependencies**  -  other priorities it blocks or blocked by; other agents whose work it presumes.

6. **Name what's cut.** End with paragraph: "What we are NOT doing this quarter and why." Solo founders over-commit; calling out protects top 3.

7. **Structure output (markdown, ~500-800 words), `roadmaps/q{n}-{year}.md`:**

   1. **Quarter goal**  -  one sentence.
   2. **Priority 1**  -  title · size · rationale · dependencies.
   3. **Priority 2**  -  same shape.
   4. **Priority 3**  -  same shape.
   5. **What we're NOT doing**  -  paragraph.
   6. **Check-in cadence**  -  how often revisit (default: every 3 weeks).
   7. **Sources**  -  links to feature-fit docs, incidents, competitor briefs informing each priority.

8. **Never invent velocity.** No history on team shipping pace = sizing rough guess  -  say so. No fake burndowns, no fake story points.

9. **Write atomically** to `roadmaps/q{n}-{year}.md`  -  `{path}.tmp` then rename.

10. **Append to `outputs.json`.** Read-merge-write atomically:

    ```json
    {
      "id": "<uuid v4>",
      "type": "roadmap",
      "title": "Roadmap  -  Q<n> <year>",
      "summary": "<2-3 sentences  -  the quarter goal + top 3 priorities headline>",
      "path": "roadmaps/q<n>-<year>.md",
      "status": "draft",
      "createdAt": "<ISO-8601>",
      "updatedAt": "<ISO-8601>"
    }
    ```

11. **Summarize to user.** One paragraph: quarter goal + top 3 + what's cut + path to doc. Call out which agent owns first move on each priority.

## Outputs

- `roadmaps/q{n}-{year}.md`
- Appends to `outputs.json` with `type: "roadmap"`.