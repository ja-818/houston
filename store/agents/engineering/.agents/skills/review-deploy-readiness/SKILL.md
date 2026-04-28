---
name: review-deploy-readiness
description: "Use when you say 'is {release} ready to deploy' / 'run the deploy gate checklist' / 'GO or NO-GO on {release}'  -  pre-deploy gate checklist (tests green, migrations backwards-compat, feature flags, rollback plan, on-call aware, runbook updated) with green / yellow / red per gate and a final GO / NO-GO / SOFT-GO verdict. Writes to `deploy-readiness/{release-slug}.md`. Never runs deploy  -  I produce the verdict, you click the button."
version: 1
tags: [engineering, review, deploy]
category: Engineering
featured: yes
image: laptop
integrations: [github, gitlab]
---


# Review Deploy Readiness

Last gate before deploy. Run green/yellow/red checklist against quality bar from engineering-context doc, output verdict. **Agent does NOT deploy. Produces readiness doc; user deploys.**

## When to use

- "Is {release} ready to deploy"
- "Run the deploy gate checklist"
- "GO or NO-GO on {release}"
- "Check readiness for release {release-slug}"

## Hard nos (the posture)

- **Never run `deploy` or any deploy-adjacent command.** No `kubectl apply`, no `gh workflow run deploy`, no CLI push to prod.
- **Never flip feature flag.** Even to verify  -  ask user to check.
- **Never merge or tag on user's behalf.**

## Steps

1. **Read engineering context** at `context/engineering-context.md`. If missing or empty, tell user to run `define-engineering-context` skill first and stop. Context doc defines quality bar (required checks, deploy cadence, release gating)  -  gates below graded against it.

2. **Read config:** `config/ci-cd.json`, `config/observability.json`, `config/on-call.md`. If `config/release-cadence.json` missing and engineering-context doesn't state cadence, ask ONE question to capture (ship daily / weekly / gated / whenever ready) and write config.

3. **Get release identifier.** Ask for release slug or reference (tag, branch, release notes draft). Without it can't read right run / PRs.

4. **Pull release data.** Via `composio search code-hosting`:
   - PR(s) in release (or merge commits since last tag).
   - Required-check status on merge target.
   - Migrations in diff (search `migrations/`, `schema.prisma`, `alembic/`, or stack-specific patterns from engineering-context).
   - Feature-flag references in diff.

5. **Run gate checklist.** Per gate, write one-line reason + color (🟢 green / 🟡 yellow / 🔴 red):

   | Gate | What I check |
   |------|--------------|
   | **Tests green** | All required checks on release commit passing. |
   | **Migrations backwards-compatible** | Schema change has reversible path; no destructive migrations without two-phase plan. |
   | **Feature flags in place for risky changes** | Non-trivial behavior changes behind flag defaulted off. |
   | **Rollback plan documented** | Rollback procedure in release notes or linked runbook. |
   | **On-call aware** | On-call notified (config/on-call.md tells who). |
   | **Runbook updated** | If release adds new failure mode (new service, new critical path), runbook exists. |
   | **Customer comms drafted** | If user-facing, release note + proactive comms drafted (even if not sent). |
   | **Observability coverage** | Critical paths instrumented (errors tracked, logs structured, alert present for new surface). |

6. **Flag anything I can't see.** If PR list unavailable or migration diff unreadable, mark gate 🟡 with reason "logs UNKNOWN  -  agent couldn't fetch {thing}; user should confirm."

7. **Decide verdict:**
   - **GO 🟢**  -  all gates green, or at most one yellow with concrete mitigation named.
   - **SOFT-GO 🟡**  -  ship with caveats. Multiple yellows or specific risk user accepts; caveats spelled out.
   - **NO-GO 🔴**  -  any red gate. Ship blocked; what to fix first.

8. **Draft readiness doc** in this structure:

   ```markdown
   # Deploy readiness: {release-slug}

   **Verdict:** GO / SOFT-GO / NO-GO
   **Date:** {YYYY-MM-DD}
   **Release:** {tag or description}
   **PRs:** {linked PR numbers}

   ## Gate checklist

   | Gate | Status | Reason |
   |------|--------|--------|
   | Tests green | 🟢 / 🟡 / 🔴 | {one line} |
   | Migrations backwards-compat | 🟢 / 🟡 / 🔴 | {one line} |
   | Feature flags | 🟢 / 🟡 / 🔴 | {one line} |
   | Rollback plan | 🟢 / 🟡 / 🔴 | {one line} |
   | On-call aware | 🟢 / 🟡 / 🔴 | {one line} |
   | Runbook updated | 🟢 / 🟡 / 🔴 | {one line} |
   | Customer comms | 🟢 / 🟡 / 🔴 | {one line} |
   | Observability | 🟢 / 🟡 / 🔴 | {one line} |

   ## Risks

   - {Risk 1  -  what could go wrong, blast radius, how to detect fast.}
   - {Risk 2.}

   ## If SOFT-GO  -  caveats

   - {Caveat 1  -  what the user is accepting.}

   ## Next actions (for the user, not the agent)

   1. {e.g. "Click deploy in GitHub Actions"  -  if GO.}
   2. {e.g. "Fix {failing check} and re-run review-deploy-readiness."}
   3. {e.g. "Monitor {dashboard URL} for the first 15 minutes."}
   ```

9. **Write** atomically to `deploy-readiness/{release-slug}.md` (`*.tmp` → rename).

10. **Append to `outputs.json`**  -  new entry `{ id, type: "deploy-readiness", title, summary, path, status: "ready", createdAt, updatedAt }`. Summary names verdict.

11. **Summarize to user**  -  one paragraph with verdict, reason(s) behind any yellow/red gates, path to doc. **Final sentence: "You deploy. I don't  -  even if it's green."**

## Outputs

- `deploy-readiness/{release-slug}.md`
- Appends to `outputs.json` with `type: "deploy-readiness"`.