---
name: define-playbook
description: "Use when you say 'write my sales playbook' / 'draft the playbook' / 'our ICP changed' / 'let's lock pricing' — I interview you briefly and write the full playbook (ICP, buying committee, qualification framework, pricing stance, deal stages, objection handbook, competitors, primary first-call goal) to `context/sales-context.md`. Every other skill reads it first — until it exists, they stop and ask for it."
integrations:
  docs: [googledocs, notion]
---

# Define Playbook

Skill OWNS `context/sales-context.md`. No other skill writes it.
Skill create or update. Its existence unblock every other skill in agent.

## When to use

- "write my sales playbook" / "draft the playbook" / "let's do the playbook".
- "update the playbook" / "our ICP changed, fix the playbook" / "update pricing stance".
- Called implicitly by any skill needing playbook if missing — only after confirming with user.

## Ledger fields I read

Read `config/context-ledger.json` first.

- `universal.company` — name, website, 30s pitch, stage. Required.
  If missing, ask ONE question with modality hint ("paste your homepage URL — or connect HubSpot and I'll pull the company record").
- `universal.icp` — industry, roles, pains, triggers. If thin, playbook section say `TBD` honestly; no invent.
- `domains.crm.slug` + `dealStages` — seed Deal stages section. Ask ONE question if missing: "Which CRM — HubSpot, Salesforce, Attio, Pipedrive, Close? Or paste your stage list."
- `domains.meetings.qualificationFramework` — MEDDPICC / BANT / custom. Ask if missing.

## Steps

1. **Read ledger + existing playbook.** If `context/sales-context.md` exists, read so run is update, not rewrite. Preserve what founder already sharpened; change only stale or new.

2. **Mine recent calls if available.** Read `calls/*/analysis-*.md` and `call-insights/*.md`. Pull objection patterns and verbatim pain phrases straight into handbook; no paraphrase.

3. **Push for verbatim customer language.** Before draft, ask founder for 2-3 verbatim customer quotes (pain named, phrase about category, objection heard). If `call-insights/` has entries, mine those first. No marketer-speak paraphrase.

4. **Draft playbook (~500-800 words, opinionated, concrete).** Structure, in order:

   1. **Company overview** — one paragraph: what we make, who for, what make worth building now.
   2. **ICP** — industry, size, region, stage. Name **1-2 anchor accounts** (real closed-won or target).
   3. **Buying committee** — champion (title + motivations), economic buyer (title + what win them), blocker (who kill deals + why), influencers.
   4. **Disqualifiers** — 3-5 hard nos. See X, walk.
   5. **Qualification framework** — MEDDPICC / BANT / founder's own list. Write questions this agent ask to score each pillar.
   6. **Pricing stance** — model, bands (if disclosed), discount policy, minimum viable terms, non-negotiable line.
   7. **Deal stages + exit criteria** — what move deal Stage N → N+1. Concrete: "Stage 2 exits when champion has confirmed pain AND identified the economic buyer by name."
   8. **Objection handbook** — top 5 objections + founder's best current response. Prefer verbatim call-derived phrasing over marketing-speak.
   9. **Top 3 competitors** — named, one-line "they're strong at X, we beat on Y" each.
   10. **Primary first-call goal** — single ask every discovery call lands on. Concrete: "Next step is a technical validation with their eng lead in the next 7 days."

5. **Mark gaps honestly.** If section thin (no call data, no anchor account named), write `TBD — {what the founder should bring next}` not guess. Never invent.

6. **Write atomically.** Write to `context/sales-context.md.tmp`, then rename to `context/sales-context.md`. Single file. NOT under `.agents/`. NOT under `.houston/<agent>/`.

7. **Update ledger.** Set `universal.playbook = { present: true, path: "context/sales-context.md", lastUpdatedAt: <ISO> }` and any `universal.icp` / `domains.crm.dealStages` / `domains.meetings.qualificationFramework` fields interview newly captured. Atomic read-merge-write of `config/context-ledger.json`.

8. **Append to `outputs.json`.** Read existing array, append:

   ```json
   {
     "id": "<uuid v4>",
     "type": "playbook",
     "title": "Sales playbook updated",
     "summary": "<2-3 sentences — what changed this pass>",
     "path": "context/sales-context.md",
     "status": "draft",
     "createdAt": "<ISO-8601>",
     "updatedAt": "<ISO-8601>",
     "domain": "playbook"
   }
   ```

   (Playbook itself live file, but each substantive edit indexed so founder see update on dashboard.)

9. **Summarize to user.** One paragraph: what you changed, what still `TBD`, exact next move (e.g. "run `profile-icp` for {segment} to fill buying-committee section"). Remind them every other skill now has context.

## What I never do

- Invent ICP, pricing, competitors, or objections. Thin sections get `TBD` — never guessed.
- Overwrite sharpened sections on update pass — preserve what founder tightened.
- Write playbook anywhere except `context/sales-context.md`.

## Outputs

- `context/sales-context.md` (at agent root — live document).
- Updates `config/context-ledger.json`.
- Appends to `outputs.json` with `type: "playbook"`, `domain: "playbook"`.