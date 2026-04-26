---
name: book-a-meeting-with-someone-3-times-proposed
description: "I propose 3 times that respect your focus blocks and max-meetings-per-day, draft the outreach in your voice, and create the event only after you approve."
version: 1
tags: ["operations", "overview-action", "schedule-meeting"]
category: "Scheduling"
featured: yes
integrations: ["googlecalendar", "gmail", "outlook"]
image: "clipboard"
inputs:
  - name: name
    label: "Name"
prompt_template: |
  Book a 30-min meeting with {{name}}. Use the schedule-meeting skill. Propose 3 times that respect my focus blocks, buffers, and max-meetings-per-day. Draft the counterparty message in my voice. Iterate on back-and-forth if needed. Create the event in Google Calendar ONLY after my explicit approval.
---


# Book a meeting with someone  -  3 times proposed
**Use when:** Respects focus blocks. Draft outreach. No surprise events.
**What it does:** I propose 3 times that respect your focus blocks and max-meetings-per-day, draft the outreach in your voice, and create the event only after you approve.
**Outcome:** Proposal at meetings/{slug}-proposal.md. Event created only after approval.
## Instructions
Run this as a user-facing action. Use the underlying `schedule-meeting` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Book a 30-min meeting with {name}. Use the schedule-meeting skill. Propose 3 times that respect my focus blocks, buffers, and max-meetings-per-day. Draft the counterparty message in my voice. Iterate on back-and-forth if needed. Create the event in Google Calendar ONLY after my explicit approval.
```
