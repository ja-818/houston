---
name: draft-this-week-s-newsletter
description: "Subject + preview + body with one clear through-line. Pulls source material from this week's blog / case-study / launch outputs if relevant."
version: 1
tags: ["marketing", "overview-action", "write-content"]
category: "Email"
featured: yes
integrations: ["googledocs", "linkedin", "twitter", "reddit", "mailchimp", "firecrawl"]
image: "megaphone"
inputs:
  - name: date
    label: "Date"
    placeholder: "e.g. 2026-03-31"
prompt_template: |
  Draft this week's newsletter. Use the write-content skill with channel=newsletter. Subject + preview + body with one clear through-line (not 5 updates glued together). Pull source material from this week's blog posts / case studies / launches in outputs.json if relevant. Save to newsletters/{{date}}.md ready for my connected Beehiiv / Substack / ESP.
---


# Draft this week's newsletter
**Use when:** One through-line. Pulls source from recent outputs.
**What it does:** Subject + preview + body with one clear through-line. Pulls source material from this week's blog / case-study / launch outputs if relevant.
**Outcome:** Newsletter at newsletters/{date}.md ready for your ESP.
## Instructions
Run this as a user-facing action. Use the underlying `write-content` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft this week's newsletter. Use the write-content skill with channel=newsletter. Subject + preview + body with one clear through-line (not 5 updates glued together). Pull source material from this week's blog posts / case studies / launches in outputs.json if relevant. Save to newsletters/{YYYY-MM-DD}.md ready for my connected Beehiiv / Substack / ESP.
```
