---
name: define-engineering-context
description: "Use when you say 'write the engineering context' / 'draft our context doc' — I interview you briefly (or read your connected GitHub) and write the full engineering context doc (product, stack, architecture, quality bar, team, priorities, conventions) to `context/engineering-context.md`. Every other skill reads it first — until it exists, they stop and ask for it."
integrations:
  dev: [github, gitlab, linear, jira]
---

# Define Engineering Context

Skill OWNS `context/engineering-context.md`. No other skill writes it. This skill creates or updates. Its existence unblocks every other substantive skill in agent.

## When to use

- "write the engineering context" / "draft our context doc" / "let's do the context".
- "update the context doc" / "our stack changed, fix the context".
- Called implicitly by any other skill needing context that finds doc missing — only after confirming with user.

## Ledger fields I read / write

Reads `config/context-ledger.json` first. Primary writer of:

- `universal.company` — name, website, 30s pitch, stage.
- `universal.product` — what it is, who uses it.
- `universal.engineeringContext` — flips `present: true`, sets `lastUpdatedAt` after write.
- `universal.priorities` — top 3 this quarter, quarter label.
- `domains.development.stack` — languages, frameworks, databases.
- `domains.development.sensitiveAreas` — auth, payments, migrations, public API, etc.
- `domains.development.qualityBar` — testCoverage + requiredChecks.
- `domains.reliability.cicd.provider` — github-actions / gitlab-ci / circleci / etc.

Anything missing → ask ONE targeted question per topic with modality hint (best first: connect GitHub via Composio > paste README / CI config > URL > describe in 2 lines). Write each answer atomically to ledger, continue.

## Steps

1. **Read ledger.** Pull existing universal + development + reliability fields. Each missing required field → ask ONE question with modality hint. Write answers to ledger atomically (`*.tmp` → rename). Never ask same field twice.

2. **Read existing doc if present.** If `context/engineering-context.md` exists, read so this run = update, not rewrite. Preserve anything founder sharpened; change only stale or new.

3. **Pull fresh evidence if possible.** If founder has connected code host (via Composio), fetch:
   - Latest `README.md` — extract product description + quality-bar hints.
   - Latest CI config (`.github/workflows/*.yml`, `.gitlab-ci.yml`, `.circleci/config.yml`, `Jenkinsfile`) — extract deploy cadence + test expectations.
   - Active milestones / labels from connected issue tracker — cross-check priorities.

   Run `composio search code-hosting` / `composio search issue-tracker` to discover slugs at runtime. No connection → work from ledger + user paste only, mark thin sections `TBD — {what to bring next}`.

4. **Draft doc (~300-500 words, opinionated, direct).** Structure, this order:

   1. **Product** — one paragraph: what product is, who uses it, what makes it worth building now.
   2. **Stack** — languages, frameworks, DB, infra, CI/CD, observability. Each as short bulleted row.
   3. **Architecture** — shape (monolith / microservices / serverless / mobile / hybrid), main module boundaries, non-negotiable invariants.
   4. **Quality bar** — test coverage expectations, PR review rules (who reviews, what blocks), deploy cadence (continuous / weekly / on-demand), release gating (who approves).
   5. **Team shape** — named humans with timezones. On-call shape (usually "just the founder" for week 0).
   6. **Current priorities** — top 3 for quarter, each with one line of context.
   7. **Conventions** — commit message format, branch naming, PR description template, sensitive areas. Concrete examples, not abstract rules.

5. **Mark gaps honestly.** Section thin (no quality bar yet, no conventions agreed) → write `TBD — {what the founder should bring next}` rather than guessing. Never invent stack choice, invariant, or priority.

6. **Write atomically.** Write to `context/engineering-context.md.tmp`, rename to `context/engineering-context.md`. NOT under subfolder. NOT under `.agents/`. NOT under `.houston/<agent>/`.

7. **Update ledger.** Flip `universal.engineeringContext.present` to `true`, set `lastUpdatedAt` to now. Atomic write.

8. **Append to `outputs.json`.** Read existing array, append, write atomically:

   ```json
   {
     "id": "<uuid v4>",
     "type": "analysis",
     "title": "Engineering context updated",
     "summary": "<2-3 sentences — stack headline + architecture shape + what changed this pass>",
     "path": "context/engineering-context.md",
     "status": "ready",
     "createdAt": "<ISO-8601>",
     "updatedAt": "<ISO-8601>",
     "domain": "planning"
   }
   ```

   (Doc itself live file, but each substantive edit indexed so update shows on dashboard.)

9. **Summarize to user.** One paragraph: what changed, what still `TBD`, exact next move (e.g. "connect your CI provider and I'll fill deploy cadence"). Remind them every other skill now has context it needs.

## What I never do

- Invent stack, architecture choice, or priority. Missing data → `TBD` + what to bring next.
- Write context doc to subfolder, to `.agents/`, or under `.houston/<agent>/`. Always `context/engineering-context.md` at agent root.
- Hardcode tool names — Composio discovery at runtime only.

## Outputs

- `context/engineering-context.md` (at agent root — live document).
- Appends to `outputs.json` with `type: "analysis"`, domain `"planning"`.