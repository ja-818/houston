---
name: write-case-study
description: "Use when you say 'draft a case study for {customer}' / 'write up the {customer} story'  -  I pull the interview, email thread, or testimonial (from Airtable / your notes app via Composio, or paste) and structure it as challenge → approach → results with real numbers  -  not marketer-speak. Writes to `case-studies/{customer-slug}.md` ready for sales and your site."
version: 1
tags: [marketing, write, case]
category: Marketing
featured: yes
image: megaphone
integrations: [notion, airtable]
---


# Write Case Study

## When to use

- Explicit: "draft a case study for {customer}", "write up
  {customer} story", "turn this interview into case study".
- Implicit: after SDR / sales agent flags closed-won customer
  reference-willing + founder approve.
- One case study per customer per quarter = reasonable cadence.

## Steps

1. **Read positioning doc**:
   `context/marketing-context.md`. If missing,
   stop. Tell user run `define-positioning` first. Case
   studies must reinforce positioning  -  no drift.
2. **Read config**: `config/site.json` (voice / brand CTAs).
3. **Locate source material.** Modality preference:
   - Connected CRM / spreadsheet via Composio  -  run `composio search
     crm` or `composio search spreadsheet` (e.g. Airtable) to find
     customer record + attached interview notes.
   - Pasted interview transcript or testimonial.
   - URL to published testimonial / review.
   If none, ask ONE question naming modalities above.
4. **Extract facts.** Build fact list:
   - Customer name, industry, size, interviewee role.
   - Challenge (specific pain, verbatim customer language
     where possible).
   - Before-state metrics (what broke, how often, what cost).
   - Approach (what they did with product  -  specific features,
     workflow changes).
   - Results (numbers, timeframe, specific outcomes).
   - Pull-quotes (verbatim, attributed).
5. **Flag missing numbers.** Any result without number gets
   TBD marker for founder verify with customer. No
   fabricate metrics.
6. **Draft case study** in classic structure:
   - Headline with headline result (e.g. "How Acme cut churn 40%").
   - One-paragraph summary.
   - Challenge section.
   - Approach section.
   - Results section (numbers upfront).
   - 2-3 pull-quotes.
   - Call-to-action matching positioning doc primary CTA.
7. **Write** to `case-studies/{customer-slug}.md` atomically, with
   front-matter block: customer, industry, headlineResult, status.
8. **Append to `outputs.json`**  -  `{ id, type: "case-study", title,
   summary, path, status: "draft", createdAt, updatedAt }`.
9. **Summarize to user**  -  headline result, any TBD numbers
   need founder/customer confirmation, path.

## Never invent

Never fabricate customer quote, metric, or outcome. If source
no have data, mark TBD. Push back if founder want
"round up" number into something cleaner than reality.

## Outputs

- `case-studies/{customer-slug}.md`
- Appends to `outputs.json` with type `case-study`.