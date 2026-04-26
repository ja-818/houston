---
name: score-this-ticket-rice-or-moscow
description: "I apply RICE or MoSCoW to a single ticket or a list, with per-axis reasoning grounded in priorities from the engineering context, and a final ranking."
version: 1
tags: ["engineering", "overview-action", "score-ticket-priority"]
category: "Triage"
featured: yes
integrations: ["github", "linear", "jira"]
image: "laptop"
inputs:
  - name: ticket_or_list
    label: "Ticket Or List"
  - name: slug
    label: "Slug"
    required: false
prompt_template: |
  Score {{ticket_or_list}}. Use the score-ticket-priority skill. Apply RICE (Reach × Impact × Confidence / Effort) or MoSCoW (Must / Should / Could / Won't) with one-line reasoning per axis and a final ranking. Save to priority-scores/{{slug}}.md.
---


# Score this ticket  -  RICE or MoSCoW
**Use when:** Per-axis reasoning. Final ranking.
**What it does:** I apply RICE or MoSCoW to a single ticket or a list, with per-axis reasoning grounded in priorities from the engineering context, and a final ranking.
**Outcome:** A scoring table at priority-scores/{slug}.md ready to justify the call.
## Instructions
Run this as a user-facing action. Use the underlying `score-ticket-priority` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Score {ticket or list}. Use the score-ticket-priority skill. Apply RICE (Reach × Impact × Confidence / Effort) or MoSCoW (Must / Should / Could / Won't) with one-line reasoning per axis and a final ranking. Save to priority-scores/{slug}.md.
```
