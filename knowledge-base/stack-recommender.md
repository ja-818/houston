# Stack Recommender — Composio toolkits from plain-language intent

Lives in `engine/houston-composio/src/recommender/`. End user types a goal in
their own words; engine returns a curated stack of 2-6 Composio toolkits
(with logos, role, reason, alternatives) AND can turn that stack into a
ready-to-use custom agent (CLAUDE.md + skills + routine + integrations) in
one click.

Three surfaces in the desktop app:

- Connections tab → `StackDiscoverPanel`
  (`app/src/components/tabs/stack-discover-panel.tsx`)
- New-agent modal, recommend stage → `StoreStepDiscover`
  (`app/src/components/shell/store-step-discover.tsx`)
- New-agent modal, custom-agent stage → `CustomAgentReviewStep`
  (`app/src/components/shell/custom-agent-review-step.tsx`) + the
  always-on integrations panel `CustomAgentPendingIntegrations`
  (`app/src/components/shell/custom-agent-pending-integrations.tsx`)
  mounted in `workspace-shell.tsx` above the tab bar.

Wire endpoints in `engine/houston-engine-server/src/routes/composio.rs`:

- `POST /v1/composio/recommend` → `composioRecommendStack()` in TS client
- `POST /v1/composio/generate-custom` → `composioGenerateCustomAgent()`

## Problem it solves

Composio exposes 1000+ integrations. Non-technical user knows maybe 10.
Without help they can't build an agent because they don't know what to
connect. Stack recommender turns "I want X" into a concrete pick, then
the custom-agent generator turns that pick into a working agent. The
user never sees a JSON file, never opens a terminal, never picks a model
by name.

## Pipeline (V1.6 — reasoning-first)

Single LLM round-trip per request. No retrieval-first stage in the happy
path. The LLM is the brain; embeddings only assist when the LLM names a
slug we don't have.

```
intent (string, any of en/es/pt)
   ↓
llm_pick::decompose_and_pick()
   ↓  one CLI call to `claude -p --model haiku`
   ↓
DecomposeResponse {
  subtasks: [ { description, suggestedSlugs[], role, reason }, ... ],
  missingCapabilities: [ ... ]
}
   ↓
for each subtask:
  for each slug in suggestedSlugs:
    if is_banned_app(slug)  → skip
    if catalog::find(slug)  → pick it (slug normalization: hacker-news → hackernews)
  if nothing picked:
    embedding fallback (cosine ≥ 0.65 or skip)
  if still nothing:
    push to missingCapabilities
   ↓
RecommendResult { primaryStack[], alternatives{}, missingCapabilities[], llmPicked: true, debug{} }
```

### Why reasoning-first beats retrieval-first

Retrieval-first (V1.5, kept as fallback only): embed the intent, take
top-K by cosine, hand the candidate JSON to the LLM, ask it to filter.
This drops 30-50% of relevant tools on abstract intents — if cosine
doesn't surface GitHub for "review my code", the LLM can't pick it.

Reasoning-first (V1.6): the LLM already knows the software landscape.
Ask it directly. It can name `github`, `trello`, `tavily`, `firecrawl`
without any retrieval. Embeddings only kick in when the LLM hallucinates
a slug.

The retrieval-first path lives in `retrieval_fallback()` and runs only
when the reasoning LLM call fails entirely (CLI missing, timeout, parse
error).

## Key design decisions

| Decision | Why |
|---|---|
| **Reasoning-first, embedding as fallback** | LLM world knowledge > retrieval over a tiny enriched catalog. |
| **Ban list in code, not only prompt** | LLM ignores negative instructions. `is_banned_app()` in `banlist.rs` enforces it. |
| **Ban list covers orchestrators + LLM APIs** | Make/Zapier/n8n duplicate Houston routines. OpenAI/Anthropic/Gemini duplicate the host LLM. |
| **Slug normalization** | LLM emits `hacker-news`; catalog has `hackernews`. `catalog::find` strips `-_. ` and tries again. |
| **Embedding threshold 0.65** | At 0.45 we got `hunter` (email finder) recommended for "product discovery" because the LLM suggested `producthunt` (not in catalog). High threshold + honest missing capability > weak match that misleads. |
| **`missingCapabilities` over weak match** | Telling the user "Composio doesn't have ProductHunt" is honest. Substituting a different product is misleading. |
| **One LLM call, no chain** | Latency matters. 20-50s per request is already at the edge of acceptable. |
| **Sub-task decomposition is explicit** | Multi-objective intents ("do X AND Y AND Z") must cover every objective. STEP 1B in prompt forces split for complementary sources. |
| **24h LRU cache** | Same intent + connected slugs = same answer. Cache hit is free. |
| **In-app debug payload** | `RecommendDebug` ships in every response. Inspect from browser network tab — no need for engine log access. |

## Files

| File | Role |
|---|---|
| `mod.rs` | Public `recommend()` entry. Orchestrates decompose → resolve → fallback. |
| `llm_pick.rs` | LLM calls. `decompose_and_pick` (V1.6 primary). `pick` (V1.5 retrieval fallback). |
| `banlist.rs` | `is_banned_app()` — hardcoded slugs we never recommend. |
| `catalog.rs` | Loads `data/catalog-enriched.json` via `include_str!`. `find()` with slug normalization. |
| `matcher.rs` | Tokenize + score keyword matches. Used only by V1.5 retrieval fallback. |
| `embeddings.rs` | fastembed-rs wrapper (MultilingualE5Small, 384-dim). `embed_query`, `cosine`. |
| `embedding_store.rs` | HEMB binary format (magic + version + dim + count + entries). `from_bundled()` reads `data/catalog-embeddings.bin` via `include_bytes!`. |
| `cache.rs` | 24h LRU keyed by `(normalized_intent, sorted_connected_slugs)`. |
| `types.rs` | Wire types. `EnrichedToolkit`, `StackEntry`, `RecommendResult`, `RecommendDebug`. |
| `bin/precompute_embeddings.rs` | Dev-side CLI. Reads catalog JSON, embeds toolkits, writes `data/catalog-embeddings.bin`. |

## Data files (`engine/houston-composio/data/`)

Both bundled into the engine binary at build time.

- `catalog-enriched.json` (~1.5 MB) — 1000 toolkits, each with multi-language
  `oneLiner` / `useCases` / `keywords` (en + es + pt), `typicalCombos`,
  `alternatives`, `primaryCategory`. Generated by
  `scripts/enrich-composio-catalog.mjs` (Anthropic or Gemini, ~$0.10 with
  gemini-3.1-flash-lite).
- `catalog-embeddings.bin` (~1.5 MB) — 1000 × 384 float vectors, MultilingualE5Small
  passages of `{name} | {oneLiner} | {useCases}`. Regenerated by
  `cargo run --bin precompute_embeddings`.

When the catalog changes you MUST re-run precompute_embeddings before
shipping or runtime cosine matches will be off.

## Ban list (`banlist.rs`)

Two categories, hardcoded for guarantees:

**Orchestrators** — duplicate Houston's native scheduling/routines:
`make`, `make_com`, `zapier`, `n8n`, `workato`, `pipedream`, `ifttt`,
`integromat`, `automatisch`, `kit`, `promptmate`, `promptmate_io`.

**LLM API providers** — the host IS the LLM:
`openai`, `anthropic`, `gemini`, `google_ai`, `googleai`, `cohere`,
`mistral_ai`, `mistralai`, `togetherai`, `together_ai`, `groq`, `replicate`.

Enforced at three points:
1. `decompose_and_pick` prompt asks the LLM not to suggest these.
2. `recommend()` filters suggested_slugs through `is_banned_app`.
3. `llm_pick::materialize()` (retrieval fallback) does the same.

The prompt-only rule is not enough — older runs showed the LLM picking
Promptmate or Kit despite explicit prohibition.

## Prompt structure (`build_decompose_prompt`)

The prompt instructs the LLM in 6 steps:

1. **Decompose** the goal into independent sub-tasks.
2. **Split multi-source** sub-tasks (e.g. discovery from 3 communities → 3 sub-tasks).
3. **Suggest 2-4 slugs per sub-task** in priority order (slot 1 = primary, rest = fallbacks for the same role).
4. **Prefer already-connected apps** when equivalent.
5. **NEVER suggest banned apps** (orchestrators + LLM APIs).
6. **`missingCapabilities`** for sub-tasks with no good tool.

Plus an example showing the multi-source split for the "Trello from new
dev tools" intent.

The prompt is the highest-leverage knob in the system. When the
recommender misbehaves, almost always the fix is in the prompt.

## Output (`RecommendResult`)

```json
{
  "primaryStack": [
    { "toolkit": "github", "name": "GitHub", "role": "...", "reason": "...", "connected": false, "logoUrl": "..." },
    ...
  ],
  "alternatives": { "tavily": ["firecrawl", "exa"], ... },
  "missingCapabilities": ["plain language phrase", ...],
  "llmPicked": true,
  "debug": {
    "catalogSize": 1000,
    "embeddingsLoaded": 1000,
    "intentEmbedded": false,
    "embedMs": 0,
    "topCandidateSlugs": [ ... ],
    "llmPickMs": 27553,
    "llmPickError": null
  }
}
```

`llmPicked: false` only when the LLM call failed and we fell through to
`fallback_from_candidates()` (deterministic top-K).

`debug` is always populated. Frontends can choose to hide or show it.

## Failure modes (in order)

| What | Symptom | Fallback |
|---|---|---|
| LLM CLI not installed | spawn fails | retrieval_fallback → keyword top-K + deterministic stack |
| LLM call times out (>90s) | error: "process timed out" | retrieval_fallback |
| LLM JSON parse fails | error: "invalid JSON: ..." | retrieval_fallback |
| `subtasks` returned empty | (degenerate decompose) | retrieval_fallback |
| All suggested slugs are banned/missing for a sub-task | sub-task → `missingCapabilities` | (still returns the resolved sub-tasks) |
| Catalog is empty | 503 `RecommendError::CatalogEmpty` | none — surface the error |
| Empty intent | 400 `RecommendError::EmptyIntent` | none — surface the error |

## How to extend

**Add a banned app**: edit `banlist.rs::is_banned_app` + add a test case.
Recompile engine. The prompt also lists banned categories — update the
STEP 4 block in `build_decompose_prompt` so the LLM doesn't waste tokens
suggesting it.

**Add slugs to the prompt's capability list**: edit STEP 2 of
`build_decompose_prompt` (`llm_pick.rs`). The list is hints, not
authoritative — the LLM will name slugs from world knowledge for things
not in the list. But adding common ones reduces hallucination.

**Re-enrich catalog**: run
`node scripts/enrich-composio-catalog.mjs --api-key=$GEMINI_API_KEY`.
Resumable; existing entries skipped unless `--force`. Then:
`cargo run --bin precompute_embeddings` to regenerate the embeddings bin.

**Change embedding model**: edit `embeddings.rs` (currently
`MultilingualE5Small`, 384-dim). `EMBEDDING_DIM` must match. Rerun
precompute. The HEMB binary format header (`embedding_store.rs`) carries
the dim — mismatch is rejected with a clear error.

**Adjust embedding threshold**: `EMBEDDING_FALLBACK_MIN_COSINE` in
`mod.rs`. 0.65 is the current floor. Lower → more recoveries but more
wrong matches. Higher → more `missingCapabilities`.

## Custom-agent generator (V2)

Lives in `generate_custom.rs` next to `llm_pick.rs`. After the
recommender returns a stack, the user clicks "Create custom agent with
this stack" in `StoreStepDiscover` and the dialog switches to
`CustomAgentReviewStep` (step 3 of `CreateAgentDialog`). The component:

1. Fires `composioGenerateCustomAgent({intent, stack, provider})` on
   mount. Single LLM round-trip; the prompt asks for the entire bundle
   in one JSON: `{name, description, claudeMd, skills[], routine?}`.
2. Shows the result as an editable form: name + description inputs,
   skills with checkboxes, routine with toggle + cron preview.
3. On submit, persists in this order:
   - `createAgent(workspaceId, name, "blank", undefined, claudeMd, ...)`
     — `configId="blank"` so the agent inherits the standard tab set
     (activity, routines, files, job-description, integrations).
   - `createSkill(agentPath, name, description, content)` per enabled
     skill. SKILL.md frontmatter is generated by the engine; content
     comes from the LLM.
   - `createRoutine(agentPath, {name, prompt, schedule, ...})` if
     routine is enabled.
   - `writePendingStackIntegrations(agentPath, stack)` — writes the
     FULL stack to `.houston/pending-stack-integrations.json`.
4. Hands control back to `CreateAgentDialog` which sets the new agent
   as current and switches viewMode to "activity".

The integrations panel `CustomAgentPendingIntegrations` is mounted in
`workspace-shell.tsx` above the tab bar. It reads
`.houston/pending-stack-integrations.json` via TanStack Query and
renders one row per toolkit with a "Conectado" badge (when the slug is
in the live connected-toolkits list) or a "Conectar" button (drives
the existing Composio OAuth flow). The panel is the permanent "your
agent's tools" view — it doesn't auto-hide; the user dismisses it with
the X button.

Prompt rules (in `build_generate_prompt`):
- CLAUDE.md has 4 sections exactly: `## Instructions`, `## Tools`,
  `## Learnings`, `## Examples`.
- Agent name = 1-3 words, no emoji, language matches the intent.
- Skills 1-2 max, names prefixed with an agent slug to avoid
  workspace-wide collisions.
- Routine returned only when intent contains a temporal cue
  (`daily`, `every monday`, `cada mañana`, etc — enumerated in prompt).
- Cron strictly 5-field; `validate()` downgrades to `None` on
  malformed cron rather than dropping the whole bundle.

## Providers supported

| Provider | CLI | Model | Wire format |
|---|---|---|---|
| `anthropic` | `claude -p` | `haiku` | text |
| `openai` | `codex exec --json` | `gpt-5.5-mini` | NDJSON `agent_message` |
| `gemini` | `gemini --output-format stream-json --yolo --skip-trust` | `gemini-3.1-flash-lite` | NDJSON `type:message,role:assistant` |

`run_provider` in `provider_cli.rs` dispatches by `provider.id()`.
Adding a new provider = new `run_X` function + new match arm.
Unknown providers return an honest "not yet supported" error rather
than silently falling back.

## How to extend

**Add a banned app**: edit `banlist.rs::is_banned_app` + add a test case.
Recompile engine. The prompt also lists banned categories — update the
STEP 4 block in `build_decompose_prompt` so the LLM doesn't waste tokens
suggesting it.

**Add slugs to the prompt's capability list**: edit STEP 2 of
`build_decompose_prompt` (`llm_pick.rs`). The list is hints, not
authoritative — the LLM will name slugs from world knowledge for things
not in the list. But adding common ones reduces hallucination.

**Re-enrich catalog**: run
`node scripts/enrich-composio-catalog.mjs --api-key=$GEMINI_API_KEY`.
Resumable; existing entries skipped unless `--force`. Then:
`cargo run --bin precompute_embeddings` to regenerate the embeddings bin.

**Change embedding model**: edit `embeddings.rs` (currently
`MultilingualE5Small`, 384-dim). `EMBEDDING_DIM` must match. Rerun
precompute. The HEMB binary format header (`embedding_store.rs`) carries
the dim — mismatch is rejected with a clear error.

**Adjust embedding threshold**: `EMBEDDING_FALLBACK_MIN_COSINE` in
`mod.rs`. 0.65 is the current floor. Lower → more recoveries but more
wrong matches. Higher → more `missingCapabilities`.

## Setup for a fresh checkout

Everything the recommender + generator need is bundled in the engine
binary. A fresh `cargo build -p houston-engine-server` + `pnpm tauri
dev` is enough; **no extra config files, no API keys at runtime**.
What ships:

- `engine/houston-composio/data/catalog-enriched.json` (~1.5 MB, 1000
  toolkits, multi-language) — embedded via `include_str!`.
- `engine/houston-composio/data/catalog-embeddings.bin` (~1.5 MB,
  1000 × 384 floats) — embedded via `include_bytes!`.
- The Composio CLI is auto-installed on macOS/Linux first time the user
  opens the Integrations tab. On Windows the user installs manually
  via the Houston installer (the bundled `.msi` includes `composio.exe`
  in `Program Files/Houston/bin/composio-x86_64/`).
- LLM CLI is the user's own login (Anthropic, OpenAI, or Gemini) — the
  same one Houston uses for chat. No separate setup.

Dev-only steps (only if you want to regenerate the catalog or
embeddings — end users never run these):

```bash
# 1. Re-enrich the catalog (uses Gemini or Anthropic)
export GEMINI_API_KEY=...   # or ANTHROPIC_API_KEY
node scripts/enrich-composio-catalog.mjs
# Resumable. ~$0.10 with gemini-3.1-flash-lite for 1000 toolkits.
# Writes engine/houston-composio/data/catalog-enriched.json.

# 2. Recompute embeddings
cargo run --bin precompute_embeddings
# Loads the catalog, downloads MultilingualE5Small on first run
# (~448 MB, cached in ~/.fastembed_cache/), emits
# engine/houston-composio/data/catalog-embeddings.bin.

# 3. Rebuild the engine so the new data ships
cargo build -p houston-engine-server
```

## Testing

- `cargo test -p houston-composio` — 45 unit tests cover banlist, slug
  normalization, embedding store roundtrip, matcher tokenization, cache
  key normalization, decompose-response parsing, hallucinated-slug
  rejection, custom-agent JSON parsing, cron validation.
- `cargo test -p houston-engine-server --test composio` — integration
  test for the two routes (empty-intent + empty-stack → 400).
- End-to-end requires the user's LLM CLI; validate manually with
  `pnpm tauri dev`.

## Future work (not in this PR)

- **Latency optimization** — 20-50s per request. Possible: streaming
  output, smaller model, shorter prompt, system prompt caching.
- **Surface `missingCapabilities` in UI** — the field is returned but
  the panels don't render it. Should be a soft callout ("we don't have
  a tool for X — let us know if you need one").
- **Add tool to existing custom agent** — currently the user can prune
  the stack before creating but can't grow it afterwards from the
  panel. Add a `+` row that opens a toolkit picker.
- **Recommender V1.7** — when the user prunes a chip the recommender
  should re-rank the remaining slots based on the reduced stack.
  Today it just removes; the rest stays as-is.
