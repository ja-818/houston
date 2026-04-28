# Actions (a.k.a. Skills)

Two names, one thing. **On disk + in code = "skill"** (matches Claude Code / industry). **In the UI + product copy = "Action"**. When the user asks the agent to "create an action", they mean a skill in `.agents/skills/`.

Why the split: skill is jargon for non-technical users. Action is a verb they instantly understand. Files keep the original name so Claude Code's auto-discovery (`.claude/skills/<name>` → `../../.agents/skills/<name>` symlink) keeps working unchanged.

## File layout

```
.agents/skills/<slug>/SKILL.md       # source of truth, YAML frontmatter + body
.claude/skills/<slug>                # symlink → ../../.agents/skills/<slug>
                                     # auto-created by engine on `list_skills`
```

Houston Store agent packages may also include `.agents/skills/*`.
Install copies the package to `~/.houston/agents/<id>/`; creating a
workspace agent from that definition copies those packaged skills into
the user's agent root so Actions appear in chat immediately.
Store-packaged Actions must not include legacy `inputs` or
`prompt_template`. The picker only selects the workflow; the chat
composer stays visible so the user can add free-form context, or send
the Action by itself and let the agent ask for missing details.

The body is a regular markdown file Claude Code uses as the procedure when the action runs. The frontmatter drives both **tool discovery** (Claude reads `name` + `description`) and **UI rendering** (everything else).

## Frontmatter schema

Source of truth: `engine/houston-skills/src/lib.rs` (`SkillSummary` + `SkillInput`). Parsed by `serde_yml`, so anything valid YAML works.

```yaml
---
# Identity (required)
name: research-company             # slug, kebab-case
description: Deep-dive on pricing  # one-liner Claude uses for tool matching

# Bookkeeping (optional, set by engine on create)
version: 1
tags: [research, sales]
created: 2026-04-25
last_used: 2026-04-25

# Picker presentation (optional)
category: research                 # tab in picker; missing = "Other"
featured: yes                      # showcase on chat empty-state cards
image: magnifying-glass-tilted-left
                                   # Fluent 3D emoji slug OR full https URL
integrations: [tavily, gmail]      # Composio toolkit slugs (lowercase)
---

## Procedure
Step-by-step instructions Claude follows when the action runs.
```

### Field details

| Field | Type | Default | Notes |
|------|------|---------|-------|
| `name` | string | — | Required slug. Drives the file path + Claude's tool name. |
| `description` | string | `""` | One line. Claude semantically matches user intent against this. **Specific = reliable invocation.** |
| `version` | int | `1` | Engine increments on edit. |
| `tags` | string[] | `[]` | Free-form. Surfaced in the agent's skills tab. |
| `created` / `last_used` | string | unset | YYYY-MM-DD. Engine maintains. |
| `category` | string | unset | Picker tab grouping. Missing → falls under "Other". |
| `featured` | bool | `false` | Accepts `yes` / `true` / `1` / `on`. Surfaces on the empty-chat showcase. |
| `image` | string | unset | Either an `https://...` URL OR a Fluent 3D Emoji slug (lowercased folder name from [microsoft/fluentui-emoji/assets](https://github.com/microsoft/fluentui-emoji/tree/main/assets), spaces → dashes). Resolved frontend-side via `resolveActionImage`. |
| `integrations` | string[] | `[]` | Composio toolkit slugs. Drives the small logo row on the card. |
| `inputs` | `SkillInput[]` | `[]` | Legacy. Parsed for old user Actions, ignored by the composer and Store packages must not declare it. |
| `prompt_template` | string | unset | Legacy. Parsed for old user Actions, ignored by sends and Store packages must not declare it. |

### `SkillInput` shape

Legacy compatibility only. Do not add these fields to new Actions.

| Field | Type | Default | Notes |
|------|------|---------|-------|
| `name` | string | required | Variable name for `{{ }}` in `prompt_template`. |
| `label` | string | required | Shown above the field. |
| `placeholder` | string | unset | Inside the field (or "—" hint for select). |
| `type` | enum | `text` | `text` \| `textarea` \| `select`. |
| `required` | bool | `true` | Disables Start until filled. |
| `default` | string | unset | Pre-fills the field on open. |
| `options` | string[] | `[]` | Required for `type: select`. |

## Render pipeline

1. **Engine** parses SKILL.md frontmatter via `serde_yml` (`engine/houston-skills/src/format.rs`). Unknown fields are silently ignored — old skills with `icon:` / `starter_prompt:` still parse.
2. Engine returns the full `SkillSummaryResponse` (incl. `inputs`, `promptTemplate`) on `GET /v1/skills`.
3. **App** (`useSkills` query → `tauri.ts` → `engine-client`) maps the snake/camel-case wire shape back to app's `SkillSummary`.
4. **`useAgentChatPanel`** (`app/src/components/use-agent-chat-panel.tsx`) — single source of truth for the per-agent panel UX. Owns:
   - skill discovery (featured cards on empty state)
   - selected Action chip above the composer
   - Action-only send interception
   - composer model selector + Actions button
   - Composio link card renderer
   - file-tool result renderer
   - `renderUserMessage` — decodes the action marker into a card
5. Both **BoardTab** (per-agent kanban) and **Dashboard** (Mission Control / cross-agent kanban) consume this hook so the right panel is identical in both views.

## Action invocation marker (chat persistence)

When the user runs an action, the persisted user_message body is:

```
<!--houston:action {"skill":"research-company","displayName":"Research a company","image":"...","description":"...","integrations":["tavily"],"fields":[],"message":"Focus on pricing."}-->

Use the research-company skill.

Focus on pricing.
```

- The HTML-comment marker is inert text to Claude (it ignores it) but carries everything the chat renderer needs to draw the card. Single source of truth = single persisted body.
- The marker `message` is the user's optional composer text. The body is the Claude-facing prompt and always starts with `Use the <skill> skill.`.
- Decoder lives in `@houston-ai/chat`'s `action-message.ts` so desktop AND mobile render the same card from the same payload.
- Encoder (`encodeActionMessage`) + Claude-prompt assembler (`buildActionClaudePrompt`) live in `app/src/lib/action-message.ts` — only the desktop sends actions today.

## Authoring an action via Claude

When the user asks "create an action that does X", Claude should:
1. Pick a slug (kebab-case, descriptive).
2. Write `~/.houston/workspaces/<Workspace>/<Agent>/.agents/skills/<slug>/SKILL.md` with the full frontmatter schema above.
3. Set `description` carefully — it's the trigger phrase Claude itself will use for tool matching later.
4. Default to `featured: yes` for new actions until proven otherwise (so the user actually finds them).
5. Include an `image` slug — pick a relevant Fluent 3D emoji (browse the assets folder).
6. Do not add `inputs` or `prompt_template`. Missing details belong in the skill procedure: ask the user one targeted question when needed.
7. Body: at least an `## Instructions` or `## Procedure` section.

### Naming rules — non-technical users only

The user never sees the `name` slug — they see `humanize(name)` (e.g. `"Research company"` from `"research-company"`). Houston's audience is non-technical founders who have never opened a terminal. Pick slugs that **humanize cleanly into a phrase a founder would say in chat**.

- ✅ `review-a-contract` → "Review a contract"
- ✅ `is-this-name-free` → "Is this name free"
- ✅ `prepare-the-delaware-annual-filing` → "Prepare the Delaware annual filing"
- ❌ `respond-to-a-dsr-without-missing-the-clock` ("DSR" is jargon)
- ❌ `pre-fill-an-enterprise-security-questionnaire` (verb is unnatural; humanizes oddly)
- ❌ `assemble-a-first-hire-offer-packet` ("packet" is internal jargon)

**Rules:**

1. **No insider acronyms** in the slug. NDA is fine (universally known); MSA, DSR, CIIAA, ASC, ARR, GAAP, KPI are not. If the underlying concept needs an industry term, put it in the `description` (where it's still searchable) or in the body, not the slug.
2. **2 to 6 words** when humanized. Long phrases hurt readability in cards.
3. **Verb-led, founder-voice** ("Draft an NDA", "Check my deadlines"), not internal taxonomy ("Document drafter", "Deadline tracker").
4. **No `display_name` override.** The schema does not have one. The slug *is* the name. If a slug doesn't humanize cleanly, rename it; don't paper over it.
5. **`description`** carries the user-facing one-liner shown on the card. Lead with what the user gets, then any constraint ("Drafts only, you sign"). Avoid file paths, JSON keys, tool names (Composio, Firecrawl), config field names, scope enums.
6. **`inputs[].label` and `placeholder`** must be plain language — the founder is reading them in a form. No "Counterparty Slug", no "Topic Slug", no "Date" placeholders that say "e.g. 2026-03-31" (the AI can fill the date itself).
7. **Body** is for the AI. Procedural detail (file paths, schemas, JSON shapes) is fine and necessary — it's what makes the procedure work. But anywhere the body tells the AI what to *say to the user* ("Summarize to user…", "respond:", clarifying questions), the wording must be plain English: never name files, paths, configs, or other skills' slugs.

Cross-references between skills (e.g. `prompt_template: "Use the draft-a-legal-document skill"`) live inside templates and bodies, never in user-facing wording. When you rename a primitive slug, update every cross-reference.

### When you rename or remove a packaged Action

A renamed Action that ships in a Store-bundled package needs a migration step in the package's `.migrations.json`, otherwise existing users end up with the old slug AND the new slug both present in their picker (the sync logic only adds, never deletes).

Format:

```json
[
  {
    "from": "<previous-version>",
    "to": "<this-version>",
    "renames": {
      "<old-slug>": "<new-slug>"
    }
  }
]
```

The engine applies the rename per workspace on the next sync. If only the old slug exists, it's renamed in place — body content preserved, `name:` field fixed, rest of the frontmatter refreshed from the new package. If both old and new slugs already exist (because a prior sync without migrations copied the new one alongside the old), the **old one is deleted**: the bundled package no longer ships it, every cross-reference points to the new slug, so keeping it would just leave a duplicate in the picker. See `store/README.md` for the full mechanism, including the recipe for shipping a follow-up migration step when the rename was published before the migration mechanism existed.

## Files of interest

| What | Where |
|------|-------|
| Schema (Rust) | [`engine/houston-skills/src/lib.rs`](../engine/houston-skills/src/lib.rs) |
| Parser / serializer | [`engine/houston-skills/src/format.rs`](../engine/houston-skills/src/format.rs) |
| Engine DTO | [`engine/houston-engine-core/src/skills.rs`](../engine/houston-engine-core/src/skills.rs) |
| TS wire types | [`ui/engine-client/src/types.ts`](../ui/engine-client/src/types.ts) |
| App shared hook | [`app/src/components/use-agent-chat-panel.tsx`](../app/src/components/use-agent-chat-panel.tsx) |
| Selected Action chip | [`app/src/components/selected-action-chip.tsx`](../app/src/components/selected-action-chip.tsx) |
| Card on user message | [`app/src/components/user-action-message.tsx`](../app/src/components/user-action-message.tsx) (desktop) and [`mobile/src/components/user-action-message.tsx`](../mobile/src/components/user-action-message.tsx) |
| Marker codec | [`ui/chat/src/action-message.ts`](../ui/chat/src/action-message.ts) (decode) and [`app/src/lib/action-message.ts`](../app/src/lib/action-message.ts) (encode) |
| System prompt template | [`app/src-tauri/src/houston_prompt.rs`](../app/src-tauri/src/houston_prompt.rs) (`SELF_IMPROVEMENT_GUIDANCE`) |
