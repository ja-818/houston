---
name: respond-to-a-dsr-without-missing-the-clock
description: "Computes the statutory clock (GDPR Art. 15 → 30 days, CCPA → 45 days), produces the three-file first-touch packet (acknowledgment + identity verification + export cover note). Flags attorney review if clock < 7 days."
version: 1
tags: ["legal", "overview-action", "draft-document"]
category: "Compliance"
featured: yes
integrations: ["googledocs", "googledrive", "notion", "firecrawl"]
image: "scroll"
---


# Respond to a DSR without missing the clock
**Use when:** Computes GDPR/CCPA deadline, drafts 3-file packet.
**What it does:** Computes the statutory clock (GDPR Art. 15 → 30 days, CCPA → 45 days), produces the three-file first-touch packet (acknowledgment + identity verification + export cover note). Flags attorney review if clock < 7 days.
**Outcome:** 3-file packet at dsr-responses/{request-id}-{date}/ ready for your send.
## Instructions
Run this as a user-facing action. Use the underlying `draft-document` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Respond to this DSR from {requester}. Use the draft-document skill with type=dsr-response. Compute the statutory clock (GDPR Art. 15 → 30 days, CCPA → 45 days), produce the three-file first-touch packet (acknowledgment, identity verification, export cover note). Save to dsr-responses/{request-id}-{YYYY-MM-DD}/. If clock < 7 days, flag attorneyReviewRequired.
```
