---
name: write-release-notes
description: "Use when you say 'release notes since {tag}' / 'changelog for {version}' / 'draft the {version} release notes' / 'update the CHANGELOG from PRs since {version}'  -  I pull merged PRs + linked issues via GitHub or GitLab since the given tag, filter for user-visible changes, and draft the `format` you pick: `release-notes` is a public-facing narrative with headline, highlights, breaking changes, upgrade notes · `changelog` is a Keep-A-Changelog snippet (Added / Changed / Deprecated / Removed / Fixed / Security). Writes to `release-notes/{version}.md` or `changelog/{version}.md`. Draft only  -  I never auto-commit the canonical CHANGELOG or publish notes."
version: 1
tags: [engineering, write, release]
category: Engineering
featured: yes
image: laptop
integrations: [github, gitlab, linear, jira]
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Write Release Notes

One skill, both formats. `format` param pick shape. Grounding on merged PRs + linked issues + "user-visible only, skip infra" discipline shared.

## Parameter: `format`

- `release-notes`  -  public-facing, narrative. Headline + 3-5 highlights for user, breaking changes (with migration snippet), upgrade notes, thank-yous if contributors. Saves to `release-notes/{version}.md`.
- `changelog`  -  Keep-A-Changelog snippet for version block, sectioned Added / Changed / Deprecated / Removed / Fixed / Security, one line per merged change, user-facing language. Saves to `changelog/{version}.md` as snippet user pastes into canonical `CHANGELOG.md`.

User name format plain English ("public release post" / "update our changelog") → infer. Ambiguous → ask ONE question naming 2 options.

## When to use

- Explicit per-format phrases above.
- Implicit: inside `coordinate-release` after deploy-readiness GREEN (`release-notes` for user comms, `changelog` for repo entry).

## Ledger fields I read

Reads `config/context-ledger.json` first.

- `universal.engineeringContext`  -  required. Missing: "want me to draft your engineering context first? (one skill, ~5m)" and stop.
- `universal.product`  -  voice + audience framing.
- `domains.docs.changelogFormat`  -  `keep-a-changelog` / `conventional` / `prose`. Default `keep-a-changelog` if missing.
- `domains.planning.tracker`  -  resolve issue links on PRs (Linear / Jira / GitHub Issues).

## Steps

1. **Read ledger + engineering context.** Gather missing fields (ONE question each). Write atomically.

2. **Resolve version + range.** Ask user:
   - `version` (e.g. `v2.4.0`)  -  required.
   - `since` (prior tag or date)  -  required. Default: last tag on default branch if code host resolve.
   User named only new version, no `since` → try latest release via connected code host; else ask ONE question.

3. **Discover tools via Composio.** Run `composio search code-hosting` and `composio search issue-tracker`. Code hosting missing → accept pasted list of merged PR titles + URLs, continue. Issue tracker missing → proceed without linked-issue context.

4. **Fetch merged PRs in range.** Pull title, body / description, author, merge date, labels, linked issues. Skip PRs labeled `skip-changelog` / `internal` / `infra` / `ci-only` / `dep-bump` (unless explicitly user-facing). Group by PR label or conventional-commit prefix if present (`feat:` → Added, `fix:` → Fixed, `chore(deps):` → Changed if user-visible, etc.).

5. **Branch on format.**

   - `release-notes`:
     - Draft public-facing post (~300-600 words):
       - **Headline**  -  one sentence on what release really about (not "v2.4.0 release").
       - **Highlights**  -  3-5 bullets, each user outcome ("Scheduled jobs now survive deploys"  -  not "Upgraded queue worker pool"). Link to tutorial / docs where applicable.
       - **Breaking changes**  -  each with migration snippet (bash / diff / code block). None → write "No breaking changes in this release."
       - **Upgrade notes**  -  steps user takes (config flags to flip, migrations to run, env vars to add).
       - **Fixed**  -  list user-visible bug fixes.
       - **Thanks**  -  external contributors merged PRs → name them. Only from PR author list, never invented.
     - Save to `release-notes/{version}.md`.

   - `changelog`:
     - Keep-A-Changelog snippet for version block:
       ```
       ## [{version}] - {YYYY-MM-DD}

       ### Added
       - …
       ### Changed
       - …
       ### Deprecated
       - …
       ### Removed
       - …
       ### Fixed
       - …
       ### Security
       - …
       ```
     - One line per included PR, user-facing language. Skip internal refactors unless change observable behavior.
     - Omit sections with no entries.
     - Save to `changelog/{version}.md`  -  snippet for user paste into canonical `CHANGELOG.md`. Never write canonical file direct.

6. **Mark gaps honestly.** PR title unclear + body / linked issue no disambiguate → write `TBD  -  summarize {PR-link}` not invent user outcome.

7. **Write atomically** to target path (`*.tmp` → rename).

8. **Append to `outputs.json`**  -  read-merge-write atomically: `{ id (uuid v4), type, title, summary, path, status: "draft", createdAt, updatedAt, domain: "docs" }`. Type: `"release-notes"` or `"changelog"`.

9. **Summarize to user.** One paragraph: one-sentence release headline (for `release-notes`) or count by section (for `changelog`), plus path + next action ("Copy the snippet into `CHANGELOG.md` and open a PR  -  I don't auto-commit").

## What I never do

- Auto-commit canonical `CHANGELOG.md` at repo root or push release-notes post to docs site. Drafts only.
- Invent user outcome from thin PR title. Mark `TBD` + PR link to resolve.
- Include `skip-changelog` / `infra-only` / bot-author PRs unless explicitly user-facing.
- Tag anyone as contributor not listed on merged PR in range.
- Hardcode tool names  -  Composio discovery at runtime only.

## Outputs

- `release-notes/{version}.md` (for `format = release-notes`)
- `changelog/{version}.md` (for `format = changelog`)
- Appends entry to `outputs.json` per run.