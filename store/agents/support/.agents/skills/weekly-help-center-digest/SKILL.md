---
name: weekly-help-center-digest
description: "Weekly rollup of ticket volume, top 3 themes from `patterns.json`, feature-request velocity, known-issue state changes, and the single most useful docs gap to write next."
version: 1
tags: ["support", "overview-action", "review"]
category: "Help Center"
featured: yes
integrations: ["googledocs", "notion", "slack"]
image: "headphone"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Give me the weekly help-center digest. Use the review skill with scope=help-center-digest. Read conversations.json counts for the week, patterns.json top 3 themes, requests.json velocity, known-issues.json state changes. Surface the single most useful docs gap to write next. Save to digests/{{date}}.md.
---


# Weekly help-center digest
**Use when:** Volume, top themes, high-priority unresolved.
**What it does:** Weekly rollup of ticket volume, top 3 themes from `patterns.json`, feature-request velocity, known-issue state changes, and the single most useful docs gap to write next.
**Outcome:** Digest at `digests/{date}.md` for Monday morning.
## Instructions
Run this as a user-facing action. Use the underlying `review` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Give me the weekly help-center digest. Use the review skill with scope=help-center-digest. Read conversations.json counts for the week, patterns.json top 3 themes, requests.json velocity, known-issues.json state changes. Surface the single most useful docs gap to write next. Save to digests/{YYYY-MM-DD}.md.
```
