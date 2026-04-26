---
name: draft-a-public-known-issue-status-page
description: "I draft: what's broken, who's affected, workaround, current status, ETA (only if you pre-approved one). No marketer-speak. Saves to `known-issues/{slug}.md` + updates `known-issues.json`."
version: 1
tags: ["support", "overview-action", "write-article"]
category: "Help Center"
featured: yes
integrations: ["googledocs", "notion", "github", "linear"]
image: "headphone"
inputs:
  - name: bug_id
    label: "Bug ID"
    required: false
  - name: slug
    label: "Slug"
    required: false
prompt_template: |
  Draft a public known-issue status entry for {{bug_id}}. Use the write-article skill with type=known-issue. Read bug-candidates.json for details. Draft: what's broken, who's affected, workaround, current status, ETA (only if I pre-approved one). Save to known-issues/{{slug}}.md and append to known-issues.json.
---


# Draft a public known-issue status page
**Use when:** Plain-language status: broken, workaround, status.
**What it does:** I draft: what's broken, who's affected, workaround, current status, ETA (only if you pre-approved one). No marketer-speak. Saves to `known-issues/{slug}.md` + updates `known-issues.json`.
**Outcome:** Public draft at `known-issues/{slug}.md`. Push when you're ready.
## Instructions
Run this as a user-facing action. Use the underlying `write-article` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft a public known-issue status entry for {bug id}. Use the write-article skill with type=known-issue. Read bug-candidates.json for details. Draft: what's broken, who's affected, workaround, current status, ETA (only if I pre-approved one). Save to known-issues/{slug}.md and append to known-issues.json.
```
