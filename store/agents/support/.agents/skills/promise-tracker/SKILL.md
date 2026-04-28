---
name: promise-tracker
description: "Use when you approve a draft reply containing a commitment ('I'll check with engineering by Friday', 'I'll ship next week', 'I'll follow up tomorrow')  -  I extract the promise, link it to the conversation, and append to `followups.json` with a due date so nothing slips. Surfaces in every `scan-inbox scope=morning-brief`."
version: 1
tags: [support, promise, tracker]
category: Support
featured: yes
image: headphone
---


# Promise Tracker

## When to use
- Say "send it" / "approved" on `draft.md` with time-bound language.
- Write own reply in chat with date, day, or timeframe.
- Review existing thread, mention "oh right, I told them I'd…".

Any phrase like: "I'll X by Y", "next week", "tomorrow", "by Friday", "end of day", "within the hour" triggers this.

## Steps
1. **Extract promise text** verbatim from message or draft (keep original phrasing  -  may want see what they said).
2. **Parse due date.**
   - Explicit date ("Friday", "March 3") → next occurrence in local timezone → ISO-8601 UTC.
   - Relative ("tomorrow", "next week") → apply relative to now.
   - Vague ("soon", "asap", no date) → default `now + 48h`, note ambiguity in promise text.
3. **Link to conversation.** Pull `conversationId` and `customerSlug` from thread.
4. **Append atomically** to `followups.json`:
   ```json
   { "id": "<uuid>", "conversationId": "...", "customerSlug": "...", "promise": "...", "dueAt": "...", "status": "open", "createdAt": "...", "updatedAt": "..." }
   ```
5. **Mirror promise** as dated line in `conversations/{id}/notes.md`.
6. If existing open followup on same conversation contradicted by new promise (e.g. date pushed), mark old one `status: "cancelled"`, reference new id.

## Outputs
- Appends to `followups.json`
- Appends dated line to `conversations/{id}/notes.md`
- Optionally cancels superseded followup