---
name: chase-outstanding-signatures-without-sending
description: "Reads your connected DocuSign / PandaDoc / HelloSign for outstanding envelopes, drafts polite reminders for laggards (> 5 days open, never sends), files executed copies to Google Drive."
version: 1
tags: ["legal", "overview-action", "track-legal-state"]
category: "Contracts"
featured: yes
integrations: ["googledrive", "gmail", "notion"]
image: "scroll"
---


# Chase outstanding signatures without sending
**Use when:** Reads DocuSign, drafts reminders, files executed copies.
**What it does:** Reads your connected DocuSign / PandaDoc / HelloSign for outstanding envelopes, drafts polite reminders for laggards (> 5 days open, never sends), files executed copies to Google Drive.
**Outcome:** Status board at signature-status/{date}.md with reminder drafts ready to send.
## Instructions
Run this as a user-facing action. Use the underlying `track-legal-state` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Check outstanding signatures. Use the track-legal-state skill with scope=signatures. Read my connected DocuSign / PandaDoc / HelloSign, list outstanding envelopes + days open, draft polite reminders for laggards (> 5 days open, never sends), file recently executed copies to my connected Google Drive. Save to signature-status/{YYYY-MM-DD}.md.
```
