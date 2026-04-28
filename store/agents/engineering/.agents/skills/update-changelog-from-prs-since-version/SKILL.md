---
name: update-changelog-from-prs-since-version
description: "I pull merged PRs from GitHub or GitLab since the version you name, filter for user-visible changes, and produce a Keep-A-Changelog snippet (Added / Changed / Deprecated / Removed / Fixed / Security). Never writes the canonical CHANGELOG.md - you…"
version: 1
tags: ["engineering", "overview-action", "write-release-notes"]
category: "Docs"
featured: yes
integrations: ["github", "gitlab", "linear", "jira"]
image: "laptop"
---


# Update CHANGELOG from PRs since {version}
**Use when:** Keep-A-Changelog snippet you paste into CHANGELOG.md.
**What it does:** I pull merged PRs from GitHub or GitLab since the version you name, filter for user-visible changes, and produce a Keep-A-Changelog snippet (Added / Changed / Deprecated / Removed / Fixed / Security). Never writes the canonical CHANGELOG.md  -  you paste the snippet.
**Outcome:** A changelog snippet at changelog/{version}.md. Copy into your canonical CHANGELOG.md.
## Instructions
Run this as a user-facing action. Use the underlying `write-release-notes` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Update the CHANGELOG. Use the write-release-notes skill with format=changelog. Pull merged PRs + linked issues via my connected GitHub / GitLab since {version}. Filter for user-facing changes. Produce a Keep-A-Changelog snippet sectioned Added / Changed / Deprecated / Removed / Fixed / Security  -  one line per change in user-facing language. Save to changelog/{version}.md as a snippet I paste into the canonical CHANGELOG.md. Never writes to CHANGELOG.md directly.
```
