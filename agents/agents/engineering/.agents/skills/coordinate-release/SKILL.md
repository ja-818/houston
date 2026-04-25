---
name: coordinate-release
description: "Use when you say 'coordinate the {feature} release' / 'help me prep the {feature} ship' — I break the release into a sequenced per-phase checklist (design ready? deploy plan? tests green? runbook? release notes? user docs?) and write exact copy-paste prompts for the skills in this agent that execute each phase. Writes to `release-plans/{feature-slug}.md`."
---

# Coordinate Release

One cross-agent orchestration skill. Without it, cross-agent coordination = founder's manual job: "did tech-lead review PR? did release-reliability update runbook? did backlog-triage draft notes? did docs-dx update README?" Skill turn that into single plan.

## When to use

- "coordinate the {feature} release" / "help me prep the {feature}
  ship" / "we're shipping {X}, coordinate".
- "update the release plan — we slipped".
- After `plan-roadmap` flag priority as in-flight and founder
  ask "what do all my agents need to do to ship this?"

## Steps

1. **Read engineering-context.md** (own file). If missing, STOP —
   tell user run `define-engineering-context` first. Release
   plan without deploy cadence, release gating, quality bar = guesswork.

2. **Gather release inputs** — ask ONE tight question if any
   missing (best modality hint first):
   - **What's launching** — feature name, one-line description,
     target date. (Best: paste PRD URL or short description. Or
     point at tracking issue via connected issue-tracker.)
   - **Scope of change** — API-breaking / backward-compatible /
     migration-required. (Best: paste. Default
     backward-compatible unless told otherwise.)
   - **Rollout shape** — all-at-once / feature flag / staged rollout.
     (Default: feature flag if context doc's quality bar say
     "continuous".)

3. **Read context for release gating.** Pull from
   `engineering-context.md` section 4 (Quality bar) — who approves,
   what tests block, what deploy cadence apply. Cite in plan
   so no agent re-invent rules.

4. **Draft per-agent checklist (markdown, ~500-900 words).**
   Organized into four sections — one per peer agent — plus
   timeline summary.

   ### Tech Lead (`tech-lead`)

   - Design doc exists and signed off?
   - All PRs reviewed and merged?
   - ADRs filed for any architectural decisions?
   - Any deferred tech debt worth noting?
   - **Copy-paste handoff prompt** — exact message founder
     send to `tech-lead` agent's chat, e.g.
     *"Review all PRs for {feature} and confirm the design doc at
     {path} reflects what we actually shipped. Flag any ADR we
     should file before release."*

   ### Release & Reliability (`release-reliability`)

   - Deploy window scheduled?
   - Runbook updated with new failure modes?
   - Observability wired (logs / metrics / traces / alerts for
     new surface)?
   - Rollback plan documented?
   - Incident response readiness — who on-call during
     release window?
   - **Copy-paste handoff prompt** for `release-reliability`.

   ### Backlog & Triage (`backlog-triage`)

   - All tickets for release closed or explicitly deferred?
   - Release notes drafted (user-facing language, not git log)?
   - Any bug reports pre-existing for this surface area triaged?
   - **Copy-paste handoff prompt** for `backlog-triage`.

   ### Docs & DX (`docs-dx`)

   - Changelog entry drafted?
   - README updated for any user-visible change?
   - API docs reflect new endpoints / schema changes?
   - Tutorial or migration guide needed?
   - **Copy-paste handoff prompt** for `docs-dx`.

5. **Flag critical path.** One short section: "What blocks ship
   day if missed" — single item that, if incomplete, should
   slip release. Usually one of: design doc sign-off,
   runbook for known failure mode, or migration guide for
   API-breaking change.

6. **Timeline summary.** Short day-by-day (or hour-by-hour for
   same-day releases) listing who do what when. Founder
   approve every destructive step (merge, deploy, public
   announcement).

7. **Sanity check against context doc.** Every checklist item must
   tie back to quality bar or release gating rules in
   context doc — not arbitrary "best practices". If context
   doc say "no staging, deploy straight to prod via feature flag",
   do NOT invent staging step.

8. **Write atomically** to `release-plans/{feature-slug}.md` —
   `{path}.tmp` then rename. `{feature-slug}` = kebab-case of
   feature name + target-date month (e.g.
   `release-plans/team-sso-2026-05.md`).

9. **Append to `outputs.json`.** Read-merge-write atomically:

   ```json
   {
     "id": "<uuid v4>",
     "type": "release-plan",
     "title": "<Feature> release plan",
     "summary": "<2-3 sentences — what's shipping, when, the critical-path item>",
     "path": "release-plans/<slug>.md",
     "status": "draft",
     "createdAt": "<ISO-8601>",
     "updatedAt": "<ISO-8601>"
   }
   ```

10. **Summarize to user.** One paragraph: feature + date + one
    critical-path item + 4 handoff prompts ready to paste +
    path to plan.

## Outputs

- `release-plans/{feature-slug}.md`
- Appends to `outputs.json` with `type: "release-plan"`.