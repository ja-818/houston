---
name: collect-updates
description: "Use when you say 'collect this week's updates from the team' / 'are we on track for OKRs' / 'run the weekly update loop'  -  I send reminders via Slack or Gmail, collect responses, analyze alignment against active priorities, and surface what's drifting. Dormant with a friendly message if your operating context has no team section."
version: 1
tags: [operations, collect, updates]
category: Operations
featured: yes
image: clipboard
integrations: [gmail, slack]
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Collect Updates

Team-facing weekly update loop. Skill dormant for true solo founder  -  moment founder hires 1+ people and lists in operating context, lights up.

## When to use

- "collect this week's updates from the team".
- "are we on track for OKRs this week".
- "send the Friday reminder and analyze what comes back".

## Steps

1. **Read `context/operations-context.md`.** If "Key contacts / Team" section absent, empty, or N≤1 (founder only), stop and say:

   > "This skill collects weekly updates from a team. Your operating context doesn't list anyone yet  -  so there's no one to collect from. Run `define-operating-context` and add a Team section when you hire, then this skill turns on."

   Do NOT run against external contacts not on team list.

2. **Read `config/update-template.md` if present.** Else use default template below.

3. **Send reminders.** For each team member in Team section:
   - `composio search chat` (preferred) or `composio search inbox`  -  execute send-message tool for founder's team-chat provider.
   - Deliver prompt template as DM or thread reply, addressed to that person. Use founder voice per `config/voice.md`.
   - Default template:

     > "Hi {name}  -  weekly update time. Three questions, 2 minutes:
     > (1) What shipped this week? (2) What's blocked, and what do
     > you need from me to unblock? (3) What's next week's biggest
     > bet? Reply here whenever you have 2 minutes  -  due by EOD
     > {reviewDay}."

   **Carve-out from workspace-level hard nos:** skill sends internal team reminders. NOT external communications. External sends still prohibited.

4. **Wait for responses.** User sets window (default: until EOD of `rhythm.json.reviewDay`, or 48h from send if rhythm not configured). If user invokes skill second time same week, consume window-so-far.

5. **Collect responses.** Pull replies from same chat / inbox tool, matched by thread / conversation.

6. **Analyze alignment** with active priorities from `context/operations-context.md`:

   - **On track**  -  shipped items laddering up to active priority.
   - **Drifting**  -  work happening that doesn't ladder.
   - **Blocked**  -  stated blockers, with who expected to unblock.
   - **Silent**  -  team members who didn't respond.

7. **Write** roundup to `updates/{YYYY-MM-DD}-roundup.md` with four sections + "What founder should do" list at bottom (1-3 items: unblock {person} on {thing}, re-scope {project}, recognize {win}).

8. **Atomic writes**  -  `*.tmp` → rename.

9. **Append to `outputs.json`** with `type: "updates"`, status "ready".

10. **Summarize to user**  -  counts (N on track / M drifting / P blocked / Q silent) + top founder-action from roundup.

## Outputs

- `updates/{YYYY-MM-DD}-roundup.md`
- Appends to `outputs.json` with `type: "updates"`.

## What I never do

- **Send reminders to external contacts.** Team section in operating context is allowlist; everyone else external.
- **Modify HRIS / payroll records** on back of collected updates  -  read-only on systems of record.
- **Run if Team section missing.** Stop with "no team yet" message; do not DIY team list from other sources.