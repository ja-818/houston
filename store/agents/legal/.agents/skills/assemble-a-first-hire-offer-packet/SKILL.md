---
name: assemble-a-first-hire-offer-packet
description: "Assembles the four-file first-hire packet (offer letter + CIIAA + option grant notice + exercise agreement) anchored to your current 409A. Flags attorney review if comp structure is non-standard. You send from your email."
version: 1
tags: ["legal", "overview-action", "prepare-offer-packet"]
category: "Entity"
featured: yes
integrations: ["googledocs", "googledrive"]
image: "scroll"
---


# Assemble a first-hire offer packet
**Use when:** Offer letter + CIIAA + grant notice + exercise agmt.
**What it does:** Assembles the four-file first-hire packet (offer letter + CIIAA + option grant notice + exercise agreement) anchored to your current 409A. Flags attorney review if comp structure is non-standard. You send from your email.
**Outcome:** 4-file packet at offer-packets/{candidate}-{date}/.
## Instructions
Run this as a user-facing action. Use the underlying `prepare-offer-packet` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Prepare the offer packet for {candidate}. Use the prepare-offer-packet skill. Assemble offer letter + CIIAA + option grant notice + exercise agreement anchored to my current 409A (universal.entity.four09aDate). Flag attorneyReviewRequired if comp structure is non-standard. Save to offer-packets/{candidate-slug}-{YYYY-MM-DD}/.
```
