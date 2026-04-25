---
name: write-article
description: "Use when you say 'turn this ticket into a KB article' / 'draft a known-issue page' / 'broadcast what we shipped' / 'refresh stale articles' — I produce the `type` you pick: `from-ticket` (KB article from a resolved thread) · `known-issue` (public status entry) · `broadcast-shipped` (per-customer 'you asked, we shipped' notes) · `refresh-stale` (flags + rewrites articles gone stale). Writes to `articles/` · `known-issues/` · `broadcasts/`."
integrations:
  docs: [notion, googledocs]
  helpdesk: [intercom, help_scout]
  dev: [github, linear]
---

# Write Article

One skill, every help-center writing ask. Branch on `type`.

## When to use

- **from-ticket** — "turn this ticket into article" / "document this
  resolution" / "answered same question 3x — write up." Called
  implicitly from `detect-signal signal=repeat-question` when cluster
  hits ≥3, no matching article.
- **known-issue** — "draft known-issue doc for {bug}" / "P1, put up
  status page" / chained from `draft-escalation-playbook`.
- **broadcast-shipped** — "shipped X — tell customers who asked" /
  "send 'you asked, we shipped' note."
- **refresh-stale** — "refresh articles affected by this ship" /
  "audit docs — pricing changed" / monthly help-center routine.

## Ledger fields I read

- `universal.positioning` — voice, product surface, audience.
- `domains.help-center.platform` — which KB Composio slug to mirror
  to (Notion / Intercom / Help Scout / Google Docs).
- `domains.help-center.toneProfile` — preferred KB tone.

Required field missing? Ask ONE targeted question with modality
hint, write it, continue.

## Parameter: `type`

- `from-ticket` — article grounded in resolved conversation. Pull
  thread, extract reusable answer, write to `articles/{slug}.md`.
  Mirror to connected KB platform if linked.
- `known-issue` — customer-facing status entry. Write to
  `known-issues/{slug}.md` + append to `known-issues.json` with
  `{id, title, affectedProduct, currentStatus, postedAt, updatedAt}`.
- `broadcast-shipped` — personalized "you asked, we shipped"
  drafts, one per customer in `requests.json` who asked for thing
  just shipped. Write to `broadcasts/{YYYY-MM-DD}-{slug}.md`.
- `refresh-stale` — scan `articles/` for refs now wrong (pricing,
  UI, feature name), flag `needsReview: true` in `outputs.json`,
  draft update.

## Steps

1. **Read `context/support-context.md`.** Missing? Stop.
2. **Read ledger.** Fill gaps.
3. **Branch on `type`:**
   - `from-ticket`: ask which `{conversation id}` to source, or
     pick auto from cluster surfaced by `detect-signal
     signal=repeat-question`. Read
     `conversations/{id}/thread.json`. Extract question, answer,
     screenshots, code refs. Draft in tone from
     `domains.help-center.toneProfile`.
   - `known-issue`: ask bug id + title if not given. Read
     `bug-candidates.json` for details. Draft status doc: what's
     broken, who affected, workaround, current status, ETA (only
     if pre-approved). Append to `known-issues.json`.
   - `broadcast-shipped`: ask what shipped (title + 1-sentence
     blurb). Read `requests.json`, filter to customers who asked
     for exactly this. Draft short personal note per customer,
     ref specific ask. Never bulk-send — one file per customer in
     `broadcasts/`.
   - `refresh-stale`: ask what changed (pricing / UI / feature
     name). Scan every `articles/{slug}.md` via grep for refs to
     changed element. Each hit: write proposed rewrite diff, don't
     overwrite. Mark `needsReview: true` in `outputs.json`.
4. **Write artifact** atomically.
5. **Append to `outputs.json`** with `type` =
   `kb-article` | `known-issue` | `broadcast` | `article-refresh`,
   `domain: "help-center"`, title, summary, path, status `draft`.
6. **Summarize**: headline + what to review + where to publish.

## Outputs

- `articles/{slug}.md` (for `type = from-ticket`, `refresh-stale`)
- `known-issues/{slug}.md` + `known-issues.json` entry (for
  `type = known-issue`)
- `broadcasts/{YYYY-MM-DD}-{slug}.md` (for `type = broadcast-shipped`)
- Append to `outputs.json` with `domain: "help-center"`.

## What I never do

- Publish direct to connected KB. I draft; you publish.
- Invent ETA for `known-issue` — engineering not committed? Write
  "investigating."
- Generic template for `broadcast-shipped` — every note cite
  specific request.