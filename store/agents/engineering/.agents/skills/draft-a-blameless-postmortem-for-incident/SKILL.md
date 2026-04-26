---
name: draft-a-blameless-postmortem-for-incident
description: "I read the incident timeline + linked logs from Sentry, PostHog, or Datadog and draft a blameless postmortem with Summary, Impact, Timeline, Root cause, Contributing factors, What went well, What went poorly, and Action items."
version: 1
tags: ["engineering", "overview-action", "write-postmortem"]
category: "Reliability"
featured: yes
integrations: ["linear", "jira"]
image: "laptop"
inputs:
  - name: incident
    label: "Incident"
  - name: id
    label: "ID"
    required: false
prompt_template: |
  Write the postmortem for {{incident}}. Use the write-postmortem skill. Read the incident timeline at incidents/{{id}}.md and pull linked logs from my connected Sentry / PostHog / Datadog. Draft sections: Summary, Impact, Timeline, Root cause, Contributing factors, What went well, What went poorly, Action items (each with owner + due date). Save to postmortems/{{id}}.md.
---


# Draft a blameless postmortem for {incident}
**Use when:** Summary, Impact, Timeline, Root cause, Action items.
**What it does:** I read the incident timeline + linked logs from Sentry, PostHog, or Datadog and draft a blameless postmortem with Summary, Impact, Timeline, Root cause, Contributing factors, What went well, What went poorly, and Action items.
**Outcome:** A postmortem at postmortems/{id}.md ready to share with the team.
## Instructions
Run this as a user-facing action. Use the underlying `write-postmortem` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Write the postmortem for {incident}. Use the write-postmortem skill. Read the incident timeline at incidents/{id}.md and pull linked logs from my connected Sentry / PostHog / Datadog. Draft sections: Summary, Impact, Timeline, Root cause, Contributing factors, What went well, What went poorly, Action items (each with owner + due date). Save to postmortems/{id}.md.
```
