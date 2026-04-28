---
name: write-docs
description: "Use when you say 'draft API docs for {endpoint}' / 'human docs for our OpenAPI spec' / 'write the onboarding guide' / 'new-engineer day-1 doc' / 'write a how-to for {feature}' / 'tutorial for {integration}'  -  I draft the `type` you pick: `api` reads an OpenAPI spec from GitHub or GitLab (or accepts a paste) and writes Stripe-grade per-endpoint docs · `tutorial` produces a Diátaxis-aligned how-to with numbered steps and working code · `onboarding-guide` maintains a single running `onboarding-guide.md` at the agent root. Draft only  -  I never auto-commit or publish."
version: 1
tags: [engineering, write, docs]
category: Engineering
featured: yes
image: laptop
integrations: [stripe, notion, github, gitlab, perplexityai]
---


# Write Docs

One skill, three doc types. `type` param picks shape. Grounding against engineering context + "drafts only, never publish" shared.

## Parameter: `type`

- `api`  -  per-endpoint human API doc from OpenAPI/Swagger spec (or pasted request/response). One doc per endpoint at `api-docs/{endpoint-slug}.md` with purpose, params table, request body, response body, error codes, curl example, SDK snippet.
- `tutorial`  -  Diátaxis-aligned tutorial (learning-oriented, concrete end-to-end runnable flow): overview, prerequisites, numbered steps with working code, troubleshooting, next steps. Writes `tutorials/{slug}.md`.
- `onboarding-guide`  -  single running doc at agent root (`onboarding-guide.md`): First day / First week / First month, repo map, verified setup steps, conventions, ownership (if team > 1), FAQ. Read-merge-update, never wholesale-overwrite.

User names type plain English ("API docs for {endpoint}", "how-to for {feature}", "new-engineer onboarding") → infer. Ambiguous → ask ONE question naming 3 options.

## When to use

- Explicit per-type phrases above.
- Implicit: inside `coordinate-release` for user-visible features (queue `tutorial`), or after `audit surface=readme` when lede solid but setup steps need own page (`onboarding-guide`).

## Ledger fields I read

Reads `config/context-ledger.json` first.

- `universal.engineeringContext`  -  required, all types. Missing → "want me to draft your engineering context first? (one skill, ~5m) I ground docs against it." Stop until written.
- `universal.product`  -  all types use for voice + audience framing.
- `domains.docs.docsHome`, `domains.docs.audience`  -  ask ONE question if missing (best-modality: "connect your docs tool via Composio > tell me where your docs live").

## Steps

1. **Read ledger + engineering context.** Gather missing required fields (ONE question each, best-modality first). Write atomically.

2. **Discover tools via Composio.** Run `composio search code-hosting` for `api` (fetch OpenAPI specs) + `onboarding-guide` (read README / CONTRIBUTING / Makefile / package.json scripts / docker-compose / .env.example / CI config). Run `composio search web-search` for `tutorial` prior-art lookups. Required category no connection → accept paste, continue.

3. **Branch on type.**

   - `api`:
     - Fetch spec from conventional paths (`openapi.yaml`, `openapi.json`, `swagger.json`) via connected code host, or accept pasted request/response.
     - Each endpoint (or named one): extract method + path + summary + description + params + request schema + response schemas + error codes from spec. No inventing behavior spec doesn't describe.
     - Write per-endpoint doc, sections: Purpose (one sentence, what for, not what does) · Auth · Parameters (table: name · in · type · required · notes) · Request body (schema + one real example) · Response body (one real 200 example + one 4xx / 5xx each) · Error codes (table) · curl example · SDK snippet (if SDK language named in engineering context).
     - Save `api-docs/{endpoint-slug}.md`. Slug = METHOD-path, kebab-cased (e.g. `post-v1-charges`).

   - `tutorial`:
     - Ask ONE question to pin: feature/integration, target reader (skill level + role), what "done" looks like (reader has X running).
     - Structure (Diátaxis tutorial  -  learning-oriented): Overview · Prerequisites (exact versions, connected services, API keys) · Numbered steps with working code blocks · Verify (command/check confirms step worked) · Troubleshooting (2-4 common errors + fix) · Next steps.
     - Every code block must run. Step unverifiable from repo/spec/engineering context → mark `TBD  -  needs verification` + name exactly what to bring.
     - Save `tutorials/{slug}.md`.

   - `onboarding-guide`:
     - Read existing `onboarding-guide.md` at agent root if exists  -  read-merge-update, not rewrite.
     - Pull repo structure via connected code host: top-level layout, CONTRIBUTING, Makefile, package.json scripts, docker-compose, .env.example, CI config, README.
     - Sections (stable order): First day (clone, setup, first successful local run) · First week (repo map, conventions from engineering context, how PRs work here, sensitive areas from engineering context) · First month (owned systems, where on-call rotates if applicable, FAQ).
     - Verify every setup step against actual Makefile/scripts  -  unverifiable → mark `TBD  -  verify with {command}`. Never guess setup command.
     - Log update in `outputs.json` with summary of pass changes.

4. **Write atomically** to target path (`*.tmp` → rename).

5. **Append to `outputs.json`**  -  read-merge-write atomically: `{ id (uuid v4), type, title, summary, path, status, createdAt, updatedAt, domain: "docs" }`. Type: `"api-doc"` / `"tutorial"` / `"onboarding-guide"`. Status `"draft"`.

6. **Summarize to user.** One paragraph: what shipped, what marked `TBD`, exact next move (e.g. "connect your code host and I'll fill the SDK snippet"). End: "I have not committed, pushed, or published anything  -  review and commit yourself."

## What I never do

- Auto-commit docs to repo or publish to docs site (Mintlify / GitBook / Docusaurus / Notion). Draft markdown at agent root  -  you review + commit.
- Invent API behavior spec doesn't describe. Missing field → `UNKNOWN` + what to bring.
- Guess setup commands. Makefile target/script unverifiable → mark `TBD  -  verify with {command}`.
- Wholesale-overwrite `onboarding-guide.md`. Always read-merge-update.
- Hardcode tool names  -  Composio discovery at runtime only.

## Outputs

- `api-docs/{endpoint-slug}.md` (for `type = api`)
- `tutorials/{slug}.md` (for `type = tutorial`)
- `onboarding-guide.md` at agent root (for `type = onboarding-guide`)
- Appends entry to `outputs.json` per run.