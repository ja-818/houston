---
name: turn-a-happy-customer-into-a-case-study
description: "I pull the interview / email thread / testimonial (from Airtable / notes app / paste) and structure as challenge → approach → results with real numbers - not marketer-speak."
version: 1
tags: ["marketing", "overview-action", "write-case-study"]
category: "SEO"
featured: yes
integrations: ["notion", "airtable"]
image: "megaphone"
inputs:
  - name: customer
    label: "Customer"
  - name: customer_slug
    label: "Customer Slug"
    required: false
prompt_template: |
  Draft a case study for {{customer}}. Use the write-case-study skill. Pull the interview / email thread / testimonial from my connected Airtable (or other notes app via Composio), or use what I paste. Structure as challenge → approach → results with real numbers, not marketer-speak. Save to case-studies/{{customer_slug}}.md.
---


# Turn a happy customer into a case study
**Use when:** Challenge → approach → results  -  with real numbers.
**What it does:** I pull the interview / email thread / testimonial (from Airtable / notes app / paste) and structure as challenge → approach → results with real numbers  -  not marketer-speak.
**Outcome:** Case study at case-studies/{customer}.md ready for sales + your website.
## Instructions
Run this as a user-facing action. Use the underlying `write-case-study` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Draft a case study for {customer}. Use the write-case-study skill. Pull the interview / email thread / testimonial from my connected Airtable (or other notes app via Composio), or use what I paste. Structure as challenge → approach → results with real numbers, not marketer-speak. Save to case-studies/{customer-slug}.md.
```
