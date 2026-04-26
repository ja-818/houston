---
name: draft-runbook
description: "Use when you say 'draft a runbook for {system}' / 'write me an ops doc for {failure mode}' / 'document how to {operational task}'  -  I produce a command-first ops doc with bash snippets + placeholders, dashboard URLs, rollback commands, and if-this-fails decision branches. No prose walls  -  every section is a command block or a decision branch. Writes to `runbooks/{slug}.md`."
version: 1
tags: [engineering, draft, runbook]
category: Engineering
featured: yes
image: laptop
integrations: [github, gitlab]
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Draft Runbook

Turn tribal knowledge into step-by-step command-first ops doc future-self (or future SRE) execute at 3am in panic. Optimized for panicked reader: commands first, prose minimal.

## When to use

- "Draft a runbook for {system}"
- "Write me an ops doc for {failure mode}"
- "Document how to restart / scale / rollback {thing}"
- "Write a runbook for {on-call scenario}"

## Principles

- **Command-first.** Every section: code block to copy-paste, dashboard URL, or decision branch.
- **Placeholders are explicit.** `{env}`, `{region}`, `{service}`, `{pod-name}`  -  call out at top, user fills once.
- **Least-destructive first.** Mitigations ranked by blast radius.
- **If-this-fails branches.** Every fallible step has alternative path.
- **No prose walls.** Paragraph >3 lines → bullets.

## Steps

1. **Read engineering context** at `context/engineering-context.md`. If missing, tell user run `define-engineering-context` first and stop. Need stack + infra section  -  can't write runbook without knowing cloud, orchestrator, deploy tool.

2. **Read config:** `config/ci-cd.json`, `config/observability.json`, `config/on-call.md`. Missing OK  -  proceed with placeholders where config not set.

3. **Clarify target.** Ask one question if ambiguous: "Is this a runbook for a **system** (e.g. 'the payments service') or a **failure mode** (e.g. 'payments 500s at checkout') or an **operational task** (e.g. 'promote staging DB to prod')?" Each shape different.

4. **Gather specifics.** Ask (one consolidated question) for pieces can't infer:
   - System / failure mode / task name.
   - Detection signal (alert fires, dashboard changes, customer complains).
   - Mitigations founder knows  -  ranked informally.
   - Dashboards or log sources founder checks first.
   - Rollback or revert command(s), if any.

5. **Draft runbook** in this structure:

   ```markdown
   # Runbook: {system or failure mode}

   **Owner:** {from on-call config}
   **Last updated:** {YYYY-MM-DD}

   ## When this fires
   - Alert: {alert name or pager message}
   - Symptom: {what the user sees or what the dashboard shows}
   - Severity: {S1 / S2 / S3 default}

   ## Placeholders
   - `{env}`  -  `prod` | `staging`
   - `{service}`  -  the impacted service name
   - `{region}`  -  cloud region
   - _(list every placeholder used below)_

   ## 1. Detect  -  confirm it's real
   - Open: {dashboard URL 1}
   - Check: {signal 1  -  what bad looks like}
   - If green, this is probably noise; close alert.

   ## 2. Contain  -  least-destructive first
   - Step 2a: {description}
     ```bash
     {exact command with placeholders}
     ```
     If this fails → go to 2b.
   - Step 2b: {description}
     ```bash
     {command}
     ```
     If this fails → go to 3.

   ## 3. Mitigate  -  heavier moves
   - Step 3a (feature flag off):
     ```bash
     {command}
     ```
   - Step 3b (rollback release):
     ```bash
     {command}
     ```
   - Step 3c (scale up or drain):
     ```bash
     {command}
     ```

   ## 4. Verify  -  is it fixed
   - Check: {signal 1 back to baseline}
   - Check: {probe passing}
   - Wait: {N minutes} before declaring resolved.

   ## 5. Roll back fully
   - Command:
     ```bash
     {rollback command}
     ```
   - Verify: {post-rollback signal}

   ## 6. Escalate
   - If still broken at step 3, page: {escalation target from on-call config}
   - If data loss risk, stop and page immediately.

   ## Known failure modes
   - **{failure mode 1}**  -  see step {n}.
   - **{failure mode 2}**  -  see step {n}.

   ## Related
   - Postmortem: `postmortems/{related-incident-slug}.md` (if any)
   - Incident: `incidents/{related-incident-slug}.md` (if any)
   ```

6. **Fill placeholders from known config** where possible. For commands whose exact syntax depends on cloud / orchestrator can't see, leave placeholder and note `{CONFIRM syntax for your {tool}}`  -  don't invent command.

7. **Write** atomically to `runbooks/{system-slug}.md` (`*.tmp` → rename). Slug from system or failure-mode name.

8. **Append to `outputs.json`**  -  new entry `{ id, type: "runbook", title, summary, path, status: "draft", createdAt, updatedAt }`. Stays `draft` until user confirms commands work.

9. **Summarize to user**  -  one paragraph naming runbook, commands marked `{CONFIRM …}`, and path. Suggest: "Next time this fires, open the runbook and walk the steps  -  report back what worked and what didn't, I'll refine the doc."

## Outputs

- `runbooks/{system-slug}.md`
- Appends to `outputs.json` with `type: "runbook"`.