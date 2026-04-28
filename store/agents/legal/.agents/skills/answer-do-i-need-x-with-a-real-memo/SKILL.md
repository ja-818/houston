---
name: answer-do-i-need-x-with-a-real-memo
description: "Writes a short advice memo structured as Question → Short answer → Context → Sources cited → Next move, ending with a judgment-call disclaimer. Non-routine matters flag attorney review and chain to escalation."
version: 1
tags: ["legal", "overview-action", "advise-on-question"]
category: "Advisory"
featured: yes
integrations: ["stripe"]
image: "scroll"
---


# Answer 'do I need X?' with a real memo
**Use when:** Short answer, context, sources cited, next move.
**What it does:** Writes a short advice memo structured as Question → Short answer → Context → Sources cited → Next move, ending with a judgment-call disclaimer. Non-routine matters flag attorney review and chain to escalation.
**Outcome:** Memo at advice-memos/{topic}-{date}.md. Not final legal advice  -  first pass.
## Instructions
Run this as a user-facing action. Use the underlying `advise-on-question` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Answer: {your question here, e.g. 'do I need an NDA with investors'}. Use the advise-on-question skill. Write a short advice memo with Question → Short answer → Context → Sources cited → Next move, end with a judgment-call disclaimer. Save to advice-memos/{topic-slug}-{YYYY-MM-DD}.md. If the matter is non-routine, flag it and recommend draft-document type=escalation-brief.
```
