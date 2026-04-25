---
name: customer-view
description: "Use when you say 'who is {customer}' / 'show me the full timeline for {account}' / 'score health for {account}' / 'churn risk on {account}' — I produce the `view` you pick: `dossier` (plan + history + open items) · `timeline` (chronological story) · `health` (GREEN / YELLOW / RED with 3 signals) · `churn-risk` (signal + severity + recommendation). Writes to `dossiers/` · `timelines/` · `health-scores.json` · `churn-flags.json`."
integrations:
  billing: [stripe]
  crm: [hubspot, attio, salesforce]
  inbox: [gmail]
  helpdesk: [intercom]
  analytics: [posthog]
---

# Customer View

One skill for every "tell me about this customer" ask support motion need. Branch on `view`.

## When to use

- **dossier** — "who is this customer?" / "tell me about {account}" / implicit before `draft-reply` run.
- **timeline** — "show me the full timeline for {account}" / "history on {customer}" / implicit before `review scope=qbr` or `draft-lifecycle-message type=renewal`.
- **health** — "score health for {account}" / "how's {customer} doing" / "run health."
- **churn-risk** — "churn risk on {account}" / "scan for churn risk" / "is this customer at risk?"

## Ledger fields I read

- `universal.icp.planTiers` — weight signals per tier.
- `domains.inbox.channels` — know where conversation history live.
- `domains.success.churnSignals` — operating definition of "at-risk" for this company.

Missing required field? Ask ONE targeted question with modality hint, write it, continue.

## Parameter: `view`

- `dossier` — profile + plan + MRR (via connected Stripe) + open bug-candidates + open followups + last 3 conversations. Writes to `dossiers/{slug}.md`.
- `timeline` — chronological rollup of every interaction (ticket, call, purchase, plan change, NPS). Writes to `timelines/{slug}.md`.
- `health` — GREEN / YELLOW / RED with 3 driving signals, reasoning, ONE recommended action. Writes entry to `health-scores.json` (and prose version at `dossiers/{slug}-health.md` if I ask).
- `churn-risk` — open risk flag with signal (cancellation language, repeated friction, usage cliff), severity, recommended action. Writes entry to `churn-flags.json`.

## Steps

1. **Resolve `{account}` or `{slug}`.** Gave customer name? Look up in `customers.json` by name / email / domain. No match? Ask for CRM identifier (HubSpot / Attio / Salesforce via Composio) or paste profile.
2. **Read `config/context-ledger.json`.** Fill gaps.
3. **Branch on `view`:**
   - `dossier`: read CRM record + `customers.json` + filter `conversations.json` to this customer + check `bug-candidates.json`, `followups.json`, `churn-flags.json`. Pull MRR / plan from connected Stripe. Write `dossiers/{slug}.md`.
   - `timeline`: same reads as `dossier` but also pull every conversation, plan change, invoice, NPS from connected Stripe + CRM. Sort chronologically. Write `timelines/{slug}.md`.
   - `health`: compute 3 signals (e.g. last-30-day ticket volume, recent product-usage trend via PostHog, sentiment of last 3 interactions). Apply thresholds from `domains.success.churnSignals` (ask me to define if unset). Output GREEN / YELLOW / RED + one action. Write to `health-scores.json` (read-merge-write).
   - `churn-risk`: scan last 60 days of conversations for cancellation language, 2+ frustration signals, or usage cliff. Found? Write new entry to `churn-flags.json` with signal + severity + recommended next move.
4. **Append to `outputs.json`** with appropriate `type`: `dossier` | `timeline` | `health-score` | `churn-risk`, `domain: "inbox"`, title, summary, path.
5. **Summarize to me** terse: headline (plan + status) + single most useful next move.

## Outputs

- `dossiers/{slug}.md` (for `view = dossier`)
- `timelines/{slug}.md` (for `view = timeline`)
- `health-scores.json` entry (for `view = health`)
- `churn-flags.json` entry (for `view = churn-risk`)
- Appends to `outputs.json` with `domain: "inbox"`.

## What I never do

- Surface health score or churn flag I can't ground in data from `conversations.json`, Stripe, or CRM — mark UNKNOWN and ask.
- Invent plan / MRR / usage numbers when connection missing.