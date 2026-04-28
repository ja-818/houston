---
name: support-an-audit-investor-dd-request
description: "Sample selection with documented seeds, walkthrough summaries, and document packages for first audits / investor DD / SOC prep."
version: 1
tags: ["bookkeeping", "overview-action", "audit-books"]
category: "Compliance"
featured: yes
integrations: ["gmail", "googledocs", "googledrive", "googlesheets", "hubspot", "linear", "notion", "outlook", "quickbooks", "slack", "stripe", "xero"]
image: "ledger"
---


# Support an audit / investor DD request
**Use when:** Sample selection + walkthrough notes + doc package.
**What it does:** Sample selection with documented seeds, walkthrough summaries, and document packages for first audits / investor DD / SOC prep.
**Outcome:** Response package at handoffs/audit-{period}/{request-slug}/.
## Instructions
Run this as a user-facing action. Use the underlying `audit-books` skill for the deep procedure.
Ask the user for any missing specifics, then complete the work end-to-end.
## Action Prompt
```text
Respond to the audit / DD request. Use the audit-books skill with mode=audit-response. Parse the request into discrete items. For sample-selection requests, pull a random sample of the right size from the relevant population (with seed documented for reproducibility). For walkthrough requests, summarize the process flow from context/bookkeeping-context.md. For document requests, assemble the docs into handoffs/audit-{yyyy-qq}/{request-slug}/. Flag any request that touches an area with a judgment call  -  surface the options, you decide.
```
