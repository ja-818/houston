---
name: draft-public-release-notes-since-tag
description: "I pull merged PRs + linked issues from GitHub / GitLab + Linear / Jira since your prior tag, filter for user-visible changes, and draft a public-facing narrative release post with headline, highlights, breaking changes (with migration snippets),…"
version: 1
tags: ["engineering", "overview-action", "write-release-notes"]
category: "Docs"
featured: yes
integrations: ["github", "gitlab", "linear", "jira"]
image: "laptop"
---


# Draft public release notes since {tag}
**Use when:** Headline, highlights, breaking changes, upgrade notes.
**What it does:** I pull merged PRs + linked issues from GitHub / GitLab + Linear / Jira since your prior tag, filter for user-visible changes, and draft a public-facing narrative release post with headline, highlights, breaking changes (with migration snippets), and upgrade notes.
**Outcome:** A release post at release-notes/{version}.md ready to publish.
## Instructions
Run this as a user-facing action. Use the underlying `write-release-notes` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft public release notes for {version} (since {prior tag}). Use the write-release-notes skill with format=release-notes. Pull merged PRs + linked issues via my connected GitHub / GitLab + Linear / Jira. Filter for user-visible changes. Write a narrative post: headline, 3-5 highlights (user outcomes, not 'upgraded queue worker'), breaking changes with migration snippets, upgrade notes, fixed list, thanks if contributors. Save to release-notes/{version}.md.
```
