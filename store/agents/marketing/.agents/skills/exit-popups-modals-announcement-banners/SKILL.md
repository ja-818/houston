---
name: exit-popups-modals-announcement-banners
description: "Popup copy (hook, offer, dismiss/accept CTAs) tied to a trigger (scroll, exit, time-on-page) with targeting recommendations."
version: 1
tags: ["marketing", "overview-action", "write-page-copy"]
category: "Copy"
featured: yes
integrations: ["reddit", "firecrawl"]
image: "megaphone"
---


# Exit popups, modals, announcement banners
**Use when:** Hook + offer + CTAs + trigger + targeting.
**What it does:** Popup copy (hook, offer, dismiss/accept CTAs) tied to a trigger (scroll, exit, time-on-page) with targeting recommendations.
**Outcome:** Spec at page-copy/popup-{slug}.md.
## Instructions
Run this as a user-facing action. Use the underlying `write-page-copy` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Write popup copy. Use the write-page-copy skill with surface=popup. Hook, offer, dismiss/accept CTAs  -  tied to a trigger (scroll, exit, time-on-page) with targeting recommendations. Save to page-copy/popup-{slug}.md.
```
