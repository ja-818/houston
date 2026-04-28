---
name: reframe-an-objection-3-sentences-followup
description: "I draft a 3-sentence in-call reframe (acknowledge → reframe with concrete anchor-account example → propose dated next step) plus a short follow-up email grounded in the playbook's objection handbook."
version: 1
tags: ["sales", "overview-action", "handle-objection"]
category: "Meetings"
featured: yes
integrations: ["attio", "firecrawl", "fireflies", "gmail", "gong", "googlecalendar", "googledocs", "hubspot", "linear", "linkedin", "notion", "outlook", "perplexityai", "pipedrive", "reddit", "salesforce", "stripe", "twitter"]
image: "handshake"
---


# Reframe an objection  -  3 sentences + followup
**Use when:** Acknowledge → reframe → specific next step.
**What it does:** I draft a 3-sentence in-call reframe (acknowledge → reframe with concrete anchor-account example → propose dated next step) plus a short follow-up email grounded in the playbook's objection handbook.
**Outcome:** Reframe at deals/{slug}/objections/{date}-{slug}.md  -  use the 3-sentence version live on the next touch.
## Instructions
Run this as a user-facing action. Use the underlying `handle-objection` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
They said '{objection}'  -  draft my reframe. Use the handle-objection skill. Look up the objection in the playbook's handbook + any pattern in call-insights, then draft a 3-sentence in-call reframe (acknowledge → reframe with concrete example from anchor accounts → propose dated next step) plus a 5-8 line post-call follow-up email. Save to deals/{slug}/objections/{YYYY-MM-DD}-{objection-slug}.md.
```
