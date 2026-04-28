---
name: product-announcement-email-in-app-coordinated
description: "Announcement email AND matching in-app copy (banner / modal / empty-state nudge), keyed to the launch plan if one exists."
version: 1
tags: ["marketing", "overview-action", "plan-campaign"]
category: "Email"
featured: yes
integrations: ["hubspot", "stripe", "linkedin", "mailchimp", "customerio", "googleads", "metaads"]
image: "megaphone"
---


# Product announcement  -  email + in-app, coordinated
**Use when:** Email body and matching in-app copy together.
**What it does:** Announcement email AND matching in-app copy (banner / modal / empty-state nudge), keyed to the launch plan if one exists.
**Outcome:** Full set at campaigns/announcement-{feature}.md  -  email body + in-app strings.
## Instructions
Run this as a user-facing action. Use the underlying `plan-campaign` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Plan the email + in-app announcement for {feature}. Use the plan-campaign skill with type=announcement. Draft the announcement email AND matching in-app copy (banner / modal / empty-state nudge), keyed to the launch plan at campaigns/launch-{feature}.md if one exists. Save to campaigns/announcement-{feature-slug}.md.
```
