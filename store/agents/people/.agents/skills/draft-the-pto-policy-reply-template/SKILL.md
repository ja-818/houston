---
name: draft-the-pto-policy-reply-template
description: "Drafts three reusable reply variants (direct / ambiguous / escalation) for any PTO ask. Saves to approvals/pto-reply-template.md."
version: 1
tags: ["people", "overview-action", "answer-policy-question"]
category: "Compliance"
featured: yes
integrations: ["googledocs", "gmail", "notion", "slack"]
image: "busts-in-silhouette"
---


# Draft the PTO policy reply template
**Use when:** Direct · ambiguous · escalation  -  all three paths.
**What it does:** Drafts three reusable reply variants (direct / ambiguous / escalation) for any PTO ask. Saves to approvals/pto-reply-template.md.
**Outcome:** Reusable templates at approvals/pto-reply-template.md. Paste into helpdesk when asks come in.
## Instructions
Run this as a user-facing action. Use the underlying `answer-policy-question` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft the PTO policy reply template. Use the answer-policy-question skill. Read the PTO section of the policy canon from context/people-context.md, then draft three reply variants: (a) direct yes when the ask is clearly inside policy, (b) ambiguous follow-up when I need more context, (c) escalation note when the ask exceeds policy. Write to approvals/pto-reply-template.md for reuse.
```
