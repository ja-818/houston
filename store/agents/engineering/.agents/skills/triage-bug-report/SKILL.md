---
name: triage-bug-report
description: "Use when you paste a raw bug report (Sentry alert, user email, Slack message, error text, screenshot) and want it turned into a structured ticket  -  I produce reproduction steps (where inferable), severity tied to your severity rules, route (hotfix / current sprint / backlog / close-as-not-a-bug / needs-more-info), and an issue description ready to paste into Linear, Jira, or GitHub Issues. Writes to `bug-triage/{slug}.md`. Never files or closes tickets."
version: 1
tags: [engineering, triage, bug]
category: Engineering
featured: yes
image: laptop
integrations: [github, linear, jira, slack]
---


# Triage Bug Report

Raw report → structured ticket. Never file or close  -  output markdown, you paste into tracker.

## When to use

- User: "triage this bug" / "here's a bug report" / "is this P0?" /
  "is this a hotfix?" / "how should I file this?"
- User forwards Sentry alert, user email, Slack snippet, screenshot
  description, or error trace.

## Steps

1. **Read engineering context**  -
   `context/engineering-context.md`. If missing or
   empty, say: "I need the engineering context doc first. Run the
   `define-engineering-context` skill (5 minutes), then come back."
   Stop.
2. **Read `domains.triage.severityRules` from context ledger
   (`config/context-ledger.json`).** If missing, ask ONE question:
   "I need your severity rules before I can assign P0/P1/P2/P3.
   Paste them, or accept the documented defaults (P0=outage,
   P1=broken feature, P2=degraded with workaround, P3=cosmetic) and
   we move on." Write into ledger atomically, continue.
3. **Optionally read**: `runbooks/`  -  if
   runbook exists for affected system, reference in route
   recommendation. Graceful on miss.
4. **Parse report.** Extract: observed behavior, expected
   behavior (if stated), affected surface (endpoint / page / job),
   environment (browser / OS / plan tier / version, if known), first
   seen timestamp (if known), user / customer (if shared), error
   text / stack trace (if included). Mark missing as
   UNKNOWN  -  no fabrication.
5. **Draft reproduction steps** if report has enough detail.
   Numbered, terse, imperative ("1. Open /settings. 2. Click
   Export."). If steps not inferable, write `**Repro:** needs
   more info  -  {specific thing missing, e.g. 'which browser',
   'which plan tier'}` and route as `needs-more-info`.
6. **Assign severity.** Apply `config/severity-rules.md` line by
   line. State severity AND one-sentence rationale naming
   rule that triggered ("P1 per rule 'broken feature with no
   workaround'  -  checkout page errors on submit with no fallback
   path"). Never invent severity without rules doc.
7. **Pick route.** One of:
   - `hotfix`  -  severity P0, or P1 touching sensitive area per
     engineering context.
   - `current sprint`  -  severity P1 with workaround, or P2 on
     high-priority surface.
   - `backlog`  -  severity P2/P3 not on critical path.
   - `close as not-a-bug`  -  expected behavior, user misconfiguration,
     feature request in disguise. State why.
   - `needs-more-info`  -  repro or severity inputs missing.
8. **Draft paste-ready issue description.** Format suited to
   user's tracker (from `config/issue-tracker.json`)  -  Linear and
   GitHub Issues share Markdown-friendly shape; Jira gets sections
   with `h3.` headings if specified. Include: title (≤80 chars,
   action-verb-led), summary (2-3 sentences), reproduction steps,
   expected vs. actual, severity + route, affected surface, and any
   artifact links (Sentry URL, Slack permalink) if user shared
   them.
9. **Write** `bug-triage/{slug}.md` atomically (`.tmp` → rename). Slug
   = short kebab-case from issue (e.g.
   `login-500-safari-ios.md`). Front-matter: `severity`, `route`,
   `affectedSurface`, `reporter` (if known), `firstSeen` (if known).
10. **Append to `outputs.json`**  -  type `"bug-triage"`, status
    `"draft"`, 2-3-sentence summary naming severity + route +
    surface. Read-merge-write atomically.
11. **Summarize to user**  -  one paragraph: "Triaged as {severity} /
    {route}. Reasoning: {one line}. Paste-ready description is at
    {path}. **I have not filed, edited, or closed a ticket  -  that's
    you.**" Offer one next step ("Want me to run
    `score-ticket-priority` on this too?").

## Hard nos

- Never file ticket in tracker. Never close existing
  ticket. Never assign severity without reading
  `config/severity-rules.md` first.
- Never invent reproduction steps. If report thin, mark
  `needs-more-info` and name what's missing.

## Outputs

- `bug-triage/{slug}.md`
- Appends to `outputs.json` with `{ id, type: "bug-triage", title,
  summary, path, status: "draft", createdAt, updatedAt }`.