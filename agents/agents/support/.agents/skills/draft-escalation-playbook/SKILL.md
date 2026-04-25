---
name: draft-escalation-playbook
description: "Use when you say 'draft the P1 playbook' / 'runbook for {incident type}' — I write a step-by-step incident response doc to `playbooks/{incident-type}.md` (detection, comms draft, rollback, RCA, post-mortem). Named humans, named channels, no vague handoffs."
integrations:
  messaging: [slack, microsoftteams]
  dev: [linear, github]
---

# Draft Escalation Playbook

## When to use

- "draft the P1 playbook" / "runbook for outages" / "security incident playbook."
- After incident where you say "we need real playbook for this."
- When onboarding marks incident response `TBD`.

## Steps

1. **Read `context/support-context.md`.** Pull current SLA tiers, VIP list, escalation contacts. Missing? Run `define-support-context` first.

2. **Ask two targeted questions** — no more:
   - **What counts as {type} for this product?** (P1 definition, outage = what, security incident = what). Give 2–3 example ticket phrasings.
   - **Who needs loop in?** Engineering on-call, named VIPs, legal/compliance contact, status page operator, insurance (for data incidents).

3. **Synthesize runbook** — markdown, ~300–500 words, structured by timeline:

   ```markdown
   # {Playbook Title}

   **Trigger:** {what qualifies}
   **Severity:** P{N}
   **Primary owner:** {role}

   ## First 15 minutes — Detect & contain

   1. Acknowledge in {internal-channel} — paste the customer's
      wording verbatim.
   2. Page {on-call contact} via Composio.
   3. Confirm scope — how many customers, which surface.
   4. Status page: flip to "Investigating" with 1-liner
      acknowledgement.

   ## First 60 minutes — Customer comms

   1. Send the "we know, we're on it" template to affected
      customers (template below).
   2. VIPs (see `context/support-context.md#segments`) get a 1:1 Slack/DM
      from you, not a bulk email.
   3. Update status page at the 30-min mark with progress.

   ### Customer comms template — "we know, we're on it"

   > Subject: {Issue} — we're on it
   > Hey {name},
   > {one-line description of what's broken}. We detected it at
   > {time} and are actively investigating. I'll update you again
   > within {window}. You don't need to do anything on your end.

   ## Same day — Root cause outline

   1. Engineering posts a 5-bullet RCA in {internal-channel}.
   2. Support drafts the customer-facing RCA (see template below).
   3. VIPs get a direct note with the RCA before it goes public.

   ### Customer-facing RCA template

   > Subject: {Issue} — what happened and what we're doing
   > {Two paragraphs: what broke, what we did, what's changing so
   > it doesn't happen again. Plain, no jargon.}

   ## Follow-up within 48 hours — Post-mortem

   1. Internal post-mortem doc (blameless). Owner: {engineering
      lead}.
   2. Known-issue article shipped via `write-article type=known-issue`.
   3. Any customer who experienced it gets a personal follow-up.

   ## What we never do

   - Blame a specific person in customer comms.
   - Promise a remediation date we can't keep.
   - Let the status page go quiet for > 30 min during an open
     incident.
   ```

4. **Template filled sections** — use actual VIP names, internal-channel name, tracker tool (from `context/support-context.md`). Pre-fill customer comms templates with their voice (from `context/support-context.md#voice`).

5. **Write to `playbooks/{slug}.md`** atomically (`.tmp` → rename). Slug = kebab-case (e.g. `p1-outage.md`, `security-incident.md`, `data-loss.md`).

6. **Append to `outputs.json`** with `type: "escalation-playbook"`, `domain: "quality"`, title = playbook name, summary = 2 sentences on trigger + primary owner, path `playbooks/{slug}.md`, status `draft`.

7. **Summarize to me.** One paragraph: what's in playbook, what sections still need judgement ("name engineering on-call contact," "pick internal channel"), reminder: "Edit once. Every incident after this just runs through same doc."

## Outputs

- `playbooks/{slug}.md`
- Appends to `outputs.json` with `type: "escalation-playbook"`, `domain: "quality"`.