---
name: research-account
description: "Use when you say 'research {Acme}' / 'enrich {person}' / 'qualify {url}' / 'warm intros into {Acme}' — I run the `depth` you pick: `quick-qualify` (30-second in-ICP yes/no via Firecrawl) · `full-brief` (site scrape + 12 weeks of news via Exa + tech-stack + socials — one cited brief) · `enrich-contact` (firmographics + recent signals for a named person) · `warm-paths` (first-degree intros via LinkedIn + your CRM). Every claim cites a source. Writes to `accounts/{slug}/` or `leads/{slug}/`."
integrations:
  search: [exa, perplexityai]
  scrape: [firecrawl]
  crm: [hubspot, salesforce, attio]
  social: [linkedin]
---

# Research Account

One skill, four research shapes. `depth` param pick pass. Source-citation + "never invent fact" discipline shared.

## Parameter: `depth`

- `quick-qualify` — 30-sec read of single URL. One scrape, one decision (IN-ICP / BORDER / OUT), one angle if IN. Fast triage, not brief.
- `full-brief` — multi-pass cited brief on named account: site scrape, recent news (12 weeks), tech-stack detect, social scan, intent signals. Feeds outreach + call prep.
- `enrich-contact` — named person: firmographics, role context, reporting line if discoverable, recent posts/talks, trigger signals. For outreach personalization.
- `warm-paths` — first-degree intros: search connected LinkedIn/Gmail/CRM for people who know someone at target. Rank paths by strength.

User ask imply depth ("quick read", "go deep", "enrich this person", "who do I know there") → infer. Else ask ONE question naming 4 options.

## When to use

- Explicit triggers in description.
- Implicit: inside `draft-outreach stage=cold-email` (cold email need signal — this skill find it) and `prep-meeting type=call` (call need brief).

## Ledger fields I read

Read `config/context-ledger.json` first.

- `playbook` — from `context/sales-context.md`. Required all depths (ICP ground quick-qualify; differentiators ground full-brief framing).
- `universal.icp` — explicit industry/roles/disqualifiers drive quick-qualify decision.
- `domains.crm.slug` — `warm-paths` pull first-degree connections from connected CRM + LinkedIn. Ask ONE question if missing.

## Steps

1. **Read ledger + playbook.** Gather missing required fields (ONE question each, best-modality first). Write atomically.

2. **Discover tools via Composio.** `composio search web-scrape` / `composio search search-research` / `composio search crm` / `composio search linkedin` per depth. No tool for required category connected → name category to link, stop.

3. **Branch on depth.**
   - `quick-qualify`: scrape URL (one request). Extract: what they do, who they sell to, team size signal, tech stack signal. Apply playbook disqualifiers. Output: **IN-ICP** / **BORDER** / **OUT** + one-sentence reason + one angle (single pain from playbook best matching them). Save tight `leads/{slug}/qualify-{YYYY-MM-DD}.md` (~150 words max).
   - `full-brief`: run scrape, search last 12 weeks news (funding, hires, product launches, leadership changes), detect tech stack (BuiltWith-style signals via scrape), scan company LinkedIn posts. Structure: **Snapshot** (one paragraph) → **Recent signals** (5-8 bullets, each cited w/ URL + date) → **Tech stack** (5-10 signals) → **Buying committee guesses** (pull from LinkedIn when available) → **Angles for outreach** (3 angles ranked, each tied to cited signal). Save to `accounts/{slug}/brief-{YYYY-MM-DD}.md`.
   - `enrich-contact`: search person via LinkedIn + connected CRM/email enrichment. Capture: title, company, tenure, prior companies, visible posts/talks/podcasts last 6 months, trigger signal (new role, speaker, press). Save to `leads/{slug}/enrichment-{YYYY-MM-DD}.md`.
   - `warm-paths`: via LinkedIn (Composio), find first-degree connections at target company. Cross-ref CRM for mutual-customer or mutual-investor paths. Rank: **Strong** (close connection, recent touch), **Medium** (weak tie, stale), **Weak** (third-degree only). Draft intro ask per strong path. Save to `leads/{slug}/warm-paths-{YYYY-MM-DD}.md`.

4. **Cite every claim.** No uncited facts. Any claim without URL or CRM field reference marked `(hypothesis — verify)`.

5. **Append to `outputs.json`** — read-merge-write atomically: `{ id (uuid v4), type: "account-brief" | "contact-enrichment" | "warm-paths" | "lead-batch" (for quick-qualify), title, summary, path, status: "ready", createdAt, updatedAt, domain: "outbound" }`.

6. **Summarize to user.** Top finding + path. Suggest next skill ("`draft-outreach stage=cold-email` using angle #1?" or "`prep-meeting type=call` if this turns into meeting?").

## What I never do

- Invent news, funding, hires, tech-stack facts, connections. Every claim cite source.
- Scrape private data — LinkedIn public profile, company website, public news only.
- Enrich contact personal life beyond professional footprint.

## Outputs

- `quick-qualify` → `leads/{slug}/qualify-{YYYY-MM-DD}.md`
- `full-brief` → `accounts/{slug}/brief-{YYYY-MM-DD}.md`
- `enrich-contact` → `leads/{slug}/enrichment-{YYYY-MM-DD}.md`
- `warm-paths` → `leads/{slug}/warm-paths-{YYYY-MM-DD}.md`
- Appends to `outputs.json`.