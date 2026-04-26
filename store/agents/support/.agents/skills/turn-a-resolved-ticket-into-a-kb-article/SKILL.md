---
name: turn-a-resolved-ticket-into-a-kb-article
description: "I extract the question + answer from the resolved thread and draft in your help-center tone. Saves to `articles/{slug}.md` and mirrors to your connected KB (Notion / Intercom / Help Scout / Google Docs) if linked."
version: 1
tags: ["support", "overview-action", "write-article"]
category: "Help Center"
featured: yes
integrations: ["googledocs", "notion", "github", "linear"]
image: "headphone"
inputs:
  - name: id
    label: "ID"
    required: false
  - name: slug
    label: "Slug"
    required: false
prompt_template: |
  Turn this resolved conversation into a help-center article. Use the write-article skill with type=from-ticket. Read conversations/{{id}}/thread.json, extract the reusable question + answer, and draft in the tone profile from domains.help-center.toneProfile. Save to articles/{{slug}}.md and mirror to my connected KB (Notion / Intercom / Help Scout / Google Docs) if one's linked.
---


# Turn a resolved ticket into a KB article
**Use when:** Structure + tone + slug  -  ready to publish.
**What it does:** I extract the question + answer from the resolved thread and draft in your help-center tone. Saves to `articles/{slug}.md` and mirrors to your connected KB (Notion / Intercom / Help Scout / Google Docs) if linked.
**Outcome:** Draft at `articles/{slug}.md`. Publish when you're happy.
## Instructions
Run this as a user-facing action. Use the underlying `write-article` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Turn this resolved conversation into a help-center article. Use the write-article skill with type=from-ticket. Read conversations/{id}/thread.json, extract the reusable question + answer, and draft in the tone profile from domains.help-center.toneProfile. Save to articles/{slug}.md and mirror to my connected KB (Notion / Intercom / Help Scout / Google Docs) if one's linked.
```
