---
name: research-compliance
description: "Use when you say 'compliance check on {company}' / 'is {vendor} clean' / 'run compliance due-diligence'  -  public-source compliance research: frameworks held, named officers, recent incidents. Every claim cited. Writes to `compliance-reports/{company-slug}.md`."
version: 1
tags: [operations, research, compliance]
category: Operations
featured: yes
image: clipboard
integrations: [linkedin, firecrawl, perplexityai]
inputs:
  - name: request
    label: "Request"
    placeholder: "Add context, links, constraints, or leave blank"
    type: textarea
    required: false
prompt_template: |
  Request: {{request}}
---


# Research Compliance

Public-source only. Due-diligence before founder sign  -  not legal opinion, not replacement for SOC2 report request.

## When to use

- "run compliance due-diligence on {vendor}".
- "is {company}'s compliance posture real".
- "what frameworks does {vendor} actually hold".
- Called as sub-step of `evaluate-supplier` for risk-sensitive suppliers (data processors, infra, financial services).

## Steps

1. **Read `context/operations-context.md`.**
   Hard nos + vendor posture anchor "what's material red flag" judgement. If missing: stop, ask for `define-operating-context`.

2. **Gather public signals.**

   - **Frameworks claimed on their surface**  -  `composio search web-scrape` → pull trust page, security page, privacy page. Catalog claims (SOC2 Type II, ISO 27001, HIPAA, GDPR, PCI-DSS, etc.).
   - **Independent verification**  -  for each claim, triangulate: trust-center provider (TrustArc, Vanta, Drata) confirm? Press release name specific auditor? Report ID or Trust portal exist? Use `composio search research` with specific queries.
   - **Named CCO / CISO / Head-of-Security**  -  identify person, link LinkedIn if findable (`composio search social` or `web-search`).
   - **Public incidents last 3 years**  -  breaches, SEC disclosures, class actions, regulatory actions (FTC, ICO, state AGs). Use `composio search news` + `web-search` with pointed queries.
   - **Legal / regulatory posture**  -  open litigation naming company as defendant? SEC filings if public?

3. **Check gaps between claim and evidence.**
   - Claim SOC2 but no independent confirmation anywhere → flag.
   - Named officer but no LinkedIn / no public presence → flag.
   - Silence on framework their category usually requires (e.g. healthcare SaaS with no HIPAA mention) → flag.

4. **Produce output** (save to `compliance/{company-slug}.md`):

   - **Summary**  -  1 paragraph: who they are + compliance posture in one line.
   - **Frameworks claimed**  -  table: framework | claim source | independent verification (Y/N with URL) | notes.
   - **Named security leadership**  -  name, title, LinkedIn, tenure if findable.
   - **Public incidents (last 3 years)**  -  chronological list, each with source URL + 1-line description.
   - **Gaps between claim and evidence**  -  bullet list, most material first.
   - **Recommendation-shaped summary**  -  NOT legal opinion: "on public surface reads as {strong / adequate / thin / concerning}" with 2-3 specific things to verify before signing.
   - **Every claim cites source URL.** No uncited assertions.

5. **Atomic writes**  -  `*.tmp` → rename.

6. **Append to `outputs.json`** with `type: "compliance"`, status "ready".

7. **Summarize to user**  -  recommendation-shaped summary + #1 gap founder should close before signing.

## Outputs

- `compliance/{company-slug}.md`
- Appends to `outputs.json` with `type: "compliance"`.

## What I never do

- **Render legal opinion.** "Looks adequate on public surface" as strong as go. Legal review = founder's lawyer's job.
- **Contact vendor.** Public signals only.
- **Treat trust-page claim as proof.** Every framework claim needs at least one independent signal, else flagged.
- **Retrieve non-public data.** If behind login, trust portal with NDA, or specific request, note as "request from vendor" rather than extract.