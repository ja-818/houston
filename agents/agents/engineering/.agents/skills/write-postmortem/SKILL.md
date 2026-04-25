---
name: write-postmortem
description: "Use when you say 'write the postmortem for {incident}' / 'draft a blameless postmortem' / 'write up the {incident} postmortem' — I read the incident timeline + linked logs from Sentry, PostHog, or Datadog and draft a blameless postmortem with Summary, Impact, Timeline, Root cause, Contributing factors, What went well, What went poorly, Action items (each with owner + due date). Writes to `postmortems/{id}.md`."
integrations:
  analytics: [sentry, posthog]
  dev: [linear, jira]
---

# Write Postmortem

Turn resolved incident into blameless postmortem founder share with team, investors, customers. Ground every claim in incident timeline or linked observability logs — never invent events.

## When to use

- "Write the postmortem for {incident}"
- "Draft a blameless postmortem"
- "Write up the {incident-slug} postmortem"
- After `run-incident-response` hands off on resolution.

## Principles

- **Blameless language throughout.** No "Alice broke X" — "change to X did not anticipate Y." Focus systems and decisions, not individuals.
- **Evidence or UNKNOWN.** Every timeline entry, every root-cause claim must cite timeline or log source. If agent can't see evidence, mark `UNKNOWN`, ask user paste.
- **Action items have owners and due dates.** Action item without owner = decoration.

## Steps

1. **Read engineering context** at `context/engineering-context.md`. If missing, tell user run `define-engineering-context` first and stop.

2. **Read config:** `config/observability.json`. If no observability connected, proceed but flag which sections thinner.

3. **Locate incident.** Ask user for incident slug or read most recent `incidents/*.md`. If file not `Status: Resolved`, ask user confirm incident actually resolved before writing postmortem.

4. **Pull supporting logs.** Run `composio search observability` to find connected providers. For incident time window, fetch: error-rate time-series, top error messages, trace samples on impacted endpoints, any alerts fired. If provider not connected, mark sections `logs UNKNOWN`, ask user paste dashboards or export snippet.

5. **Draft postmortem** in this structure:

   ```markdown
   # Postmortem: {incident title}

   **Incident:** {incident-slug}
   **Date:** {YYYY-MM-DD}
   **Duration:** {HH:MM}
   **Severity:** {S1 / S2 / S3}
   **Status:** Resolved
   **Author:** Release & Reliability agent

   ## Summary
   {2-3 sentences describing what happened in plain language.}

   ## Impact
   - Affected: {users / services / regions}
   - Duration: {from first impact to full recovery}
   - Magnitude: {error rate, revenue at risk, support tickets, etc.}

   ## Timeline
   {Chronological list from the incident timeline, one line per
   significant event with timestamp. Preserve the scribed entries
   verbatim — don't re-write them.}

   ## Root cause
   {Technical cause, stated in blameless language. Cite the change /
   config / dependency that introduced the failure.}

   ## Contributing factors
   - {Factor 1 — e.g. missing test coverage on X path.}
   - {Factor 2 — e.g. alert threshold too high to catch early.}
   - {Factor 3 — e.g. runbook didn't cover this failure mode.}

   ## What went well
   - {e.g. "Detection was fast — alert fired within 2 minutes."}
   - {e.g. "Rollback procedure worked on first attempt."}

   ## What went poorly
   - {e.g. "Status page not updated until 20 minutes in."}
   - {e.g. "Affected customer didn't get a proactive email."}

   ## Action items

   | # | Action | Owner | Due | Links |
   |---|--------|-------|-----|-------|
   | 1 | {specific, testable action} | {person} | {YYYY-MM-DD} | {ticket / PR} |
   | 2 | {...} | {...} | {...} | {...} |
   ```

6. **Write** atomically to `postmortems/{incident-slug}.md` (`*.tmp` → rename). Use same slug as incident file so pair obvious.

7. **Append to `outputs.json`** — new entry `{ id, type: "postmortem", title, summary, path, status: "draft", createdAt, updatedAt }`. Draft status until user signs off.

8. **Summarize to user** — one paragraph covering root cause, top action item, anything marked UNKNOWN needs filling in, and path to postmortem. Offer update `outputs.json` status to `"ready"` once reviewed.

## Outputs

- `postmortems/{incident-slug}.md`
- Appends to `outputs.json` with `type: "postmortem"`.