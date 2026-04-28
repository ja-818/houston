---
name: thread-summary
description: "Use when you reopen a long or old conversation cold ('what's going on here', 'remind me', 'summarize this thread') or before drafting a reply on any thread with >5 messages  -  I produce a 3-bullet summary (where we are, what we promised, what the customer expects next) so you're not re-reading the whole thread."
version: 1
tags: [support, thread, summary]
category: Support
featured: yes
image: headphone
integrations: [gmail, outlook]
---


# Thread Summary

## When to use
`conversations/{id}/thread.json` has >handful of messages, need context fast. Typical triggers:
- You: "what's the story with the Acme thread?"
- Reopen conversation dormant >3 days.
- Before `draft-reply` on thread with 5+ messages  -  run first, draft better.

## Steps
1. **Load** `conversations/{id}/thread.json` and index row from `conversations.json`.
2. **Walk thread chronologically.** Note: customer's original ask, scope changes, every promise made, every answer given.
3. **Produce exactly three bullets:**
   - **Where we are**  -  last message, sender, current state (waiting on customer / waiting on us / drafting).
   - **What we promised**  -  outstanding commitments. Pull from `followups.json` filtered by conversation, plus uncaptured promises in thread (recommend `promise-tracker` if found).
   - **What customer expects next**  -  most recent explicit or implied ask.
4. **Append summary** as dated block in `conversations/{id}/notes.md`  -  persisted for next time.

## Outputs
- Returns 3-bullet summary to chat
- Appends dated summary block to `conversations/{id}/notes.md`