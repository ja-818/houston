# Houston Store

Release-bundled registry of Houston-built agents. No start-from-zero.

## What it is

Each package under `store/agents/<agent-id>/` contains:

```text
houston.json
CLAUDE.md
icon.png
.agents/skills/<skill>/SKILL.md
```

`store/catalog.json` is the curated index returned by the engine's
`/v1/store/catalog` route. The desktop app shows those listings in
the New Agent dialog as one searchable grid. Catalog entries include
agent image slugs and integration slugs so cards match Action cards.
Installing a listing copies the package into `~/.houston/agents/<agent-id>/`;
creating an agent from that listing then copies packaged skills into the
workspace agent's `.agents/skills/`.

Every user-facing starter workflow must live as a packaged Action under
`.agents/skills/*/SKILL.md`. Store agents do not ship a custom Overview
dashboard or manifest `useCases`; the chat Actions picker is the source
of truth for those workflows.

Store manifests must not seed `.houston/activity.json` or
`.houston/activity/activity.json`. A fresh Store agent should have an
empty board; the app highlights New Mission when there is no activity.
Engine create ignores stale activity seeds from old installed packages,
and Store update sync clears the known default intro card from existing
agents only when it is the sole board item.

Every packaged Action must also declare `inputs` and `prompt_template`
frontmatter. The Store is for non-technical users, so placeholders that
would otherwise live inside a prompt must become form fields in the chat
panel. If an Action has no specific fields, include a short optional
`request` textarea so the Action still follows the same form flow.

## Updates

Houston-owned agents update with app releases. Installed definitions
record `.source.json` with `source: "houston-store"`, `version`, and
`content_hash`. On startup, update checks compare the installed source
record against the bundled catalog and refresh local definitions when
the release carries a newer package.

When a bundled package updates, Houston also syncs newly-added packaged
Actions into existing workspace agents whose `config_id` matches that
Store agent. Existing Action folders keep their local body content, but
their frontmatter metadata is refreshed from the bundled package. Result:
new Houston-built workflows appear in existing agents, Action forms can
be updated across releases, and local procedure edits stay intact.

User-created sharing is intentionally separate. Future community store
work should add publish/share flow without requiring GitHub.

## Relation to other products

- **Houston App** consumes Store in the New Agent dialog.
- **Engine** owns install/update mechanics through `/v1/store/*`.
- **Store** is static content in this repo today, not a hosted service.
