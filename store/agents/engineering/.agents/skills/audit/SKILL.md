---
name: audit
description: "Use when you say 'audit the architecture of {system}' / 'audit my CI/CD' / 'audit observability' / 'DX audit' / 'audit my README'  -  I audit the `surface` you pick: `architecture` walks a service end-to-end · `ci-cd` reads workflow config + run history via GitHub or GitLab · `observability` reviews Sentry / Datadog / PostHog coverage · `devx` estimates setup time + paper cuts · `readme` scores against a checklist with inline diff suggestions. Every finding ranked by impact × effort. Writes to `audits/{surface}-{slug}-{date}.md`  -  a prioritized fix list, not a warnings dump."
version: 1
tags: [engineering, audit]
category: Engineering
featured: yes
image: laptop
integrations: [github, gitlab, firecrawl]
---


# Audit

One skill, five audit surfaces. `surface` param pick probe. Impact × effort priority, ground against engineering context, "draft only, never auto-fix"  -  all shared.

## Parameter: `surface`

- `architecture`  -  walk system/module/service end-to-end. Risk-sorted concerns (high/medium/low) w/ current state, fix, effort (S/M/L/XL).
- `ci-cd`  -  read CI workflow config + recent run history via connected code host. Flaky tests, slowest jobs, missing gates, security gaps.
- `observability`  -  read connected stack (Sentry/Datadog/PostHog/New Relic/Honeycomb). 3-col matrix (signal × coverage × gap) across errors/traces/logs/alerts/SLOs, plus top-5 fix list.
- `devx`  -  read README, CONTRIBUTING, Makefile, package.json scripts, docker-compose, .env.example, CI config. Setup time estimate, build time from CI history, top 5 paper cuts w/ fixes.
- `readme`  -  score README vs standard checklist (pitch, badges, quickstart, install, usage, configuration, contribution, license). Inline diff suggestions, rewritten lede, prioritized fix list.

User name surface plain English ("architecture review", "CI audit", "what are we blind to", "DX paper cuts", "audit my README") → infer. Ambiguous → ask ONE question naming 5 options.

## When to use

- Explicit per-surface phrases above.
- Implicit: inside `coordinate-release` when system boundary or ops surface new (architecture/observability), or inside `validate-feature-fit` when fit verdict hinge on feasibility (architecture).
- Per-surface cadence: architecture on demand, ci-cd monthly max, observability monthly max, devx quarterly max, readme on demand.

## Ledger fields I read

Read `config/context-ledger.json` first.

- `universal.engineeringContext`  -  required all surfaces. Missing → "want me to draft your engineering context first? (one skill, ~5m) I ground every audit against it." Stop until written.
- `universal.priorities`  -  every surface use for impact weighting.
- `domains.development.stack`, `domains.development.sensitiveAreas`, `domains.development.qualityBar`  -  required for `architecture`, `ci-cd`, `devx`, `readme`. Thin → ask ONE question (best-modality hint).
- `domains.reliability.cicd.provider`  -  required `ci-cd`. Missing → run `composio search code-hosting`, fall back to conventional workflow paths, or ask.
- `domains.reliability.observability`  -  required `observability`. None connected → ask which category to link (errors/metrics/logs), stop that surface.

## Steps

1. **Read ledger + engineering context.** Gather missing required fields per surface (ONE question each, best-modality first). Write atomically.

2. **Discover tools via Composio.** Run right search for surface:
   - `architecture`, `ci-cd`, `devx`, `readme` → `composio search code-hosting`.
   - `observability` → `composio search observability` or direct (`composio search sentry` / `datadog` / `posthog`).
   - `readme` fallback no code host → `composio search web-scrape` to fetch public README URL.
   Required category no connection → name it, stop.

3. **Branch on surface.**

   - `architecture`: read target system/module/service. Walk boundaries, data flow, shared state, failure modes, scaling cliffs, test seams. Anything overlap `sensitiveAreas` → high by default. Each concern: current state, fix, effort (S/M/L/XL). Favor incremental fixes preserving shipping velocity over rewrites.

   - `ci-cd`: fetch workflow files from conventional paths (`.github/workflows/*.yml`, `.gitlab-ci.yml`, `.circleci/config.yml`, `.buildkite/pipeline.yml`, `Jenkinsfile`). Fetch last 100 runs default branch. Group failures by test name; same-SHA retry-pass = flake. Compute minutes-per-week per job. Enumerate missing gates (required checks, required reviewers, lint/type-check/dep audit/secret scan/SBOM) vs engineering-context quality bar. Flag security gaps (plaintext secrets, `pull_request_target` leaks, missing `permissions:` block, unpinned actions).

   - `observability`: read per-signal coverage from connected tool. Signals: errors, traces, logs, alerts, SLOs. Each signal record: covered? / partial / missing, what instrumented, what blind. Produce 3-col matrix. Top 5 fixes ranked by blast-radius reduction.

   - `devx`: pull README, CONTRIBUTING, Makefile, `package.json.scripts`, `docker-compose.yml`, `.env.example`, CI config. Count discrete setup steps clone → first-successful-test-run. Setup time estimate from step count + explicit time markers. Build time estimate from CI history if available. Surface top 5 paper cuts (missing env var example, flaky setup script, bad error message, stale command, zombie script). Each w/ fix + effort.

   - `readme`: fetch repo README. Score vs: one-sentence pitch above fold, install/quickstart copy-pastes, usage w/ real working example, configuration table, link to contribution/docs/LICENSE, badges (CI/version/license), obvious next-reader path. Each missing/weak section: inline diff + rewritten lede at top of report. Prioritized fix list by founder-impact.

4. **Score + prioritize.** Tag every finding `{severity: critical / high / medium / low}` × `{effort: quick-win / medium / heavy}`. Surface top 5 critical-or-high quick-wins at top.

5. **Write** atomically to `audits/{surface}-{slug}-{YYYY-MM-DD}.md` (`*.tmp` → rename). Slug: `architecture` use system/service name; `ci-cd` and `observability` use short repo slug or `main`; `devx` use repo slug; `readme` use repo slug.
   Structure: Executive summary → Top 5 quick wins → Findings per category → Prioritized fix list (impact × effort).

6. **Append to `outputs.json`**  -  read-merge-write atomically: `{ id (uuid v4), type: "audit", title, summary, path, status: "ready", createdAt, updatedAt, domain }`. Domain per surface: `architecture` / `ci-cd` / `devx` → `"development"`; `observability` → `"reliability"`; `readme` → `"docs"`.

7. **Summarize to user.** One paragraph w/ top 5 quick wins (or single biggest fix) and path. Flag anything UNKNOWN so gaps fill.

## What I never do

- Invent findings, flake rates, step counts, section scores. Every claim ties to real tool response or file observation. Missing data → UNKNOWN or TBD.
- Promise latency reduction, test-speed improvement, coverage lift percentage  -  audits surface hypotheses, not guarantees.
- Auto-fix (never open PR, never edit workflow, never rewrite README in place)  -  drafts only.
- Hardcode tool names  -  Composio discovery runtime only.

## Outputs

- `audits/{surface}-{slug}-{YYYY-MM-DD}.md`
- Append entry to `outputs.json` w/ type `audit`.