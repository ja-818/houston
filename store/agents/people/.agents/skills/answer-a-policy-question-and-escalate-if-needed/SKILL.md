---
name: answer-a-policy-question-and-escalate-if-needed
description: "Reads the policy canon + escalation rules, classifies direct / ambiguous / escalation, drafts the reply. Stops and escalates on legal-sensitive categories."
version: 1
tags: ["people", "overview-action", "answer-policy-question"]
category: "Compliance"
featured: yes
integrations: ["googledocs", "gmail", "notion", "slack"]
image: "busts-in-silhouette"
---


# Answer a policy question (and escalate if needed)
**Use when:** Classifier: direct · ambiguous · escalation. Lawyer-safe.
**What it does:** Reads the policy canon + escalation rules, classifies direct / ambiguous / escalation, drafts the reply. Stops and escalates on legal-sensitive categories.
**Outcome:** Reply or escalation note at approvals/{slug}.md. You review, send, or route to a lawyer.
## Instructions
Run this as a user-facing action. Use the underlying `answer-policy-question` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Answer this policy question: {question}. Use the answer-policy-question skill. Read the policy canon AND escalation rules from context/people-context.md, classify as direct / ambiguous / escalation, and draft the reply (or escalation note) accordingly. Never answer a legal-sensitive escalation on your own. Write to approvals/{request-slug}.md.
```
