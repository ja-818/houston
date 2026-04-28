---
name: run-incident-response
description: "Use when you say 'an incident just fired' / 'we're down' / 'something's broken in prod' / 'run the playbook with me'  -  LIVE COACH + SCRIBE mode. I walk the stabilize → communicate → mitigate → verify → document checklist while writing the incident timeline. Writes to `incidents/{id}.md`. Never auto-rollbacks, never runs commands against prod  -  I produce the next action, you execute it."
version: 1
tags: [engineering, run, incident]
category: Engineering
featured: yes
image: laptop
integrations: [slack]
---


# Run Incident Response

Live coach + scribe for active incident. User stressed. My job: run checklist so no step forgotten, write timeline so user no write. **I never act. I tell next action; user execute; I log outcome.**

## When to use

- "An incident just fired"
- "We're down"
- "Something's broken in prod"
- "Run the incident playbook with me"
- "Coach me through this outage"

Only skill where speed > polish. Start incident file immediately  -  no block on config reads.

## Hard nos (the posture)

- **Never auto-rollback.** Even if rollback command obvious. Tell user rollback command; user run.
- **Never execute command in production.** No restart, no scale-up, no feature-flag flip. I produce command; user run.
- **Never invent timestamps or events.** User say "something happened around 2pm" → log "~14:00 (approx)". Unknown → log `UNKNOWN`.
- **Never close incident unilaterally.** User confirm resolved.

## Steps

1. **Read engineering context** at
   `context/engineering-context.md`. Missing → say so brief, proceed anyway  -  incident no time to block on onboarding. Note "engineering-context MISSING" in timeline.

2. **Read config:** `config/observability.json`, `config/on-call.md`. Missing OK  -  proceed with what we have.

3. **Open incident file immediately.** Generate slug from user one-line description (e.g. `prod-api-500s`,
   `auth-login-broken`). Create
   `incidents/{YYYY-MM-DD}-{slug}.md` with skeleton:

   ```markdown
   # Incident: {one-line title}

   **Status:** Active
   **Detected at:** {ISO timestamp, or user-reported time}
   **Severity:** {S1 / S2 / S3  -  ask if unclear}
   **Commander:** {user}
   **Scribe:** Release & Reliability agent

   ## Timeline
   - {ISO timestamp}  -  Incident file opened. Reported: {raw user description}.

   ## Impact
   _TBD  -  filled in as we learn._

   ## Mitigations attempted
   _TBD_

   ## Customer comms
   _TBD_
   ```

   Atomic write. Append `outputs.json` entry with `type:
   "incident"`, `status: "draft"` now  -  dashboard show active incident immediately.

4. **Run stabilize step.** Ask ONE question: "What's the impact right now  -  who's affected, how many, what's broken?" User answer → log to `## Impact`. Then propose least-destructive containment move (e.g. "flip feature flag off," "shed traffic to healthy region," "disable offending cron"). **Tell user run it. No run it.** Log "proposed: {action}" to timeline with timestamp.

5. **Run communicate step.** Decide public status post (status page / customer email) by severity. Draft status-page update and customer email (if warranted), paste in chat for user send. **Never send without approval.** Log "comms drafted  -  awaiting send" with draft paths or content inline.

6. **Run mitigate step.** Rank mitigations by blast radius (least destructive first): feature flag off → config rollback → code rollback → full deploy rollback → emergency patch → DB restore. Each user consider → log "attempted: {action}  -  result: {user-reported outcome}". Mitigation succeed → verify. All fail → escalate.

7. **Run verify step.** Propose 2–3 signals confirm resolution (error rate back to baseline, dashboard green, probe passing, customer confirms). User check each. Log "verified: {signal}  -  {OK / still broken}" per signal.

8. **Run document step (ongoing).** Every significant event user reports → append to timeline with timestamp. No editorialize  -  capture facts as reported.

9. **When say resolved:** update file header to
   `Status: Resolved`, add `Resolved at: {ISO}` and `Duration:
   {HH:MM}`. Write final timeline entry. Update
   `outputs.json` entry to `status: "ready"`, refresh
   `updatedAt`.

10. **Offer hand-off to postmortem.** Ask: "Want me to draft the
    blameless postmortem now or do you want a breather? Either way
    the timeline is saved at `incidents/{YYYY-MM-DD}-{slug}.md`  -
    run `write-postmortem` whenever you're ready."

## Outputs

- `incidents/{YYYY-MM-DD}-{slug}.md`  -  live-updated timeline.
- Entry in `outputs.json` with `type: "incident"` (starts `draft`, becomes `ready` on resolution).