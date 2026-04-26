---
name: prep-the-1099-list-for-the-year
description: "Vendor list with YTD totals, W-9 status, and NEC / MISC classification. Drafts W-9 chase emails for any missing forms so you can hit the Jan 31 filing deadline."
version: 1
tags: ["bookkeeping", "overview-action", "track-vendor-1099s"]
category: "Compliance"
featured: yes
integrations: ["gmail", "outlook"]
image: "ledger"
inputs:
  - name: vendor_slug
    label: "Vendor Slug"
    required: false
  - name: year
    label: "Year"
    placeholder: "e.g. 2026"
prompt_template: |
  Prep the 1099 list for the specified tax year. Use the track-vendor-1099s skill. Compute YTD payments per vendor for the year. Flag 1099-eligible vendors (non-corporate, >= $600 NEC threshold / >= $600 MISC). Separate NEC from MISC categories. Cross-reference W-9 status from files/ or a vendor list. For every vendor missing a W-9, draft a chase email to drafts/1099-chase-{{vendor_slug}}.md. Save the full list to compliance/1099s/{{year}}.md. Never files  -  preps the package.
---


# Prep the 1099 list for the year
**Use when:** NEC vs. MISC, YTD totals, W-9 status, chase drafts ready.
**What it does:** Vendor list with YTD totals, W-9 status, and NEC / MISC classification. Drafts W-9 chase emails for any missing forms so you can hit the Jan 31 filing deadline.
**Outcome:** List at compliance/1099s/{year}.md + chase drafts in drafts/.
## Instructions
Run this as a user-facing action. Use the underlying `track-vendor-1099s` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Prep the 1099 list for the specified tax year. Use the track-vendor-1099s skill. Compute YTD payments per vendor for the year. Flag 1099-eligible vendors (non-corporate, >= $600 NEC threshold / >= $600 MISC). Separate NEC from MISC categories. Cross-reference W-9 status from files/ or a vendor list. For every vendor missing a W-9, draft a chase email to drafts/1099-chase-{vendor-slug}.md. Save the full list to compliance/1099s/{year}.md. Never files  -  preps the package.
```

Preferred tool or integration hint: Gmail.
