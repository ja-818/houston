---
name: draft-today-s-standup-from-my-commits-prs
description: "I pull your recent commits + PRs from GitHub / GitLab and closed tickets from Linear / Jira, then draft a three-bullet Yesterday / Today / Blockers. Never posts to Slack."
version: 1
tags: ["engineering", "overview-action", "run-standup"]
category: "Triage"
featured: yes
integrations: ["github", "gitlab", "linear", "jira", "slack", "discord"]
image: "laptop"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Draft today's standup. Use the run-standup skill. Pull recent commits + PR activity from my connected GitHub / GitLab, recently closed tickets from Linear / Jira, mix in any notes I drop. Produce three bullets: Yesterday / Today / Blockers. Save to standups/{{date}}.md. I never post to Slack  -  you copy-paste.
---


# Draft today's standup from my commits + PRs
**Use when:** Yesterday / Today / Blockers  -  copy-paste.
**What it does:** I pull your recent commits + PRs from GitHub / GitLab and closed tickets from Linear / Jira, then draft a three-bullet Yesterday / Today / Blockers. Never posts to Slack.
**Outcome:** A draft at standups/{YYYY-MM-DD}.md. Copy-paste into Slack when ready.
## Instructions
Run this as a user-facing action. Use the underlying `run-standup` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft today's standup. Use the run-standup skill. Pull recent commits + PR activity from my connected GitHub / GitLab, recently closed tickets from Linear / Jira, mix in any notes I drop. Produce three bullets: Yesterday / Today / Blockers. Save to standups/{YYYY-MM-DD}.md. I never post to Slack  -  you copy-paste.
```
