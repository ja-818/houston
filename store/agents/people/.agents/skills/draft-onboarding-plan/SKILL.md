---
name: draft-onboarding-plan
description: "Use when you say 'draft the onboarding plan for {new hire}' / 'first 90 days for {new hire}' / '{new hire} starts Monday  -  get them ready'  -  reads leveling and voice from `context/people-context.md`, then produces a Day 0 / Week 1 / 30-60-90 plan plus welcome Slack and welcome email drafts at `onboarding-plans/{employee-slug}.md`."
version: 1
tags: [people, draft, onboarding]
category: People
featured: yes
image: busts-in-silhouette
integrations: [gmail, notion, slack]
---


# Onboard New Hire

## When to use

- Explicit: "draft the onboarding plan for {new hire}", "first 90 days for {new hire}", "{new hire} starts {date}  -  get them ready", "prep onboarding for {new hire}".
- Implicit: routed from Recruiter after `draft-offer` → offer accepted, or after new hire confirmed.
- Frequency: once per new hire.

## Steps

1. **Read people-context doc.** Read `context/people-context.md` for values, leveling framework, voice notes, hard nos on onboarding. If missing/empty, tell user: "I need your people-context doc first  -  run the define-people-context skill." Stop.
2. **Read config.** `config/context-ledger.json` (HRIS) for HRIS (read-only  -  agent never modifies HRIS records) and `config/context-ledger.json` (helpdesk channel) for welcome-channel target. If core hire details missing (start date, role, level, manager, location, remote vs in-office), ask ONE targeted question covering all gaps. Best modality first (HRIS record > pasted offer letter > paste).
3. **Discover tools via Composio.** Run `composio search hris`, `composio search chat`, `composio search inbox`, `composio search calendar` to find tool slugs for reading hire's HRIS profile, drafting welcome messages, scheduling calendar blocks. If category missing, name which to link from Integrations tab and continue with rest.
4. **Compose plan** with these sections:
   - **Day 0 prep**  -  accounts to provision (email, Slack, tooling by role), equipment to ship + tracking, buddy assignment, calendar blocks for Week 1, welcome-message queue.
   - **Week 1**  -  welcome-packet contents, intro meetings (founder, team, cross-functional), tooling walkthrough, read-me docs, first shadow tasks.
   - **Day 30 milestones**  -  deliverables + check-in prompts pulled from leveling-framework expectations for this level/track.
   - **Day 60 milestones**  -  expanded deliverables + first solo ownership.
   - **Day 90 milestones**  -  full ownership + first review anchor point.
5. **Draft welcome Slack message + welcome email.** Read voice notes from `context/people-context.md` (and `config/voice.md` if present). Match tone fingerprint. Include buddy intro, Day-1 calendar link, one-line "here's what matters in your first week."
6. **Write** plan atomically to `onboarding-plans/{new-hire-slug}.md` (`*.tmp` → rename). Include welcome Slack + welcome email at bottom under clearly labeled sections so founder can lift verbatim.
7. **Append to `outputs.json`**  -  read existing array, add `{ id, type: "onboarding-plan", title, summary, path, status: "draft", createdAt, updatedAt }`. Write atomically.
8. **Summarize to user**  -  one paragraph with start date, Day-0 checklist length, path to artifact. Note welcome messages drafted but not sent  -  founder sends after review.

## Never invent

Every milestone and expectation ties back to leveling framework in `context/people-context.md`. If level not defined, mark TBD and ask  -  don't guess rubric.

## Outputs

- `onboarding-plans/{new-hire-slug}.md` (plan + welcome drafts).
- Appends to `outputs.json` with type `onboarding-plan`.