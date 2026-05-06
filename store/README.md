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
agent image slugs and integration slugs so cards match Skill cards.
Installing a listing copies the package into `~/.houston/agents/<agent-id>/`;
creating an agent from that listing then copies packaged skills into the
workspace agent's `.agents/skills/`.

Every user-facing starter workflow must live as a packaged Skill under
`.agents/skills/*/SKILL.md`. Store agents do not ship a custom Overview
dashboard or manifest `useCases`; the chat Skills picker is the source
of truth for those workflows.

Store manifests must not seed `.houston/activity.json` or
`.houston/activity/activity.json`. A fresh Store agent should have an
empty board; the app highlights New Mission when there is no activity.
Engine create ignores stale activity seeds from old installed packages,
and Store update sync clears the known default intro card from existing
agents only when it is the sole board item.

Packaged Skills must not declare legacy `inputs` or `prompt_template`
frontmatter. The Skill picker only selects the workflow; the regular
chat composer stays visible so the user can add context in plain
language, or send the Skill by itself and let the agent ask for missing
details.

## Updates

Houston-owned agents update with app releases. Installed definitions
record `.source.json` with `source: "houston-store"`, `version`, and
`content_hash`. On startup, update checks compare the installed source
record against the bundled catalog and refresh local definitions when
the release carries a newer package.

When a bundled package updates, Houston also syncs newly-added packaged
Skills into existing workspace agents whose `config_id` matches that
Store agent. Existing Skill folders keep their local body content, but
their frontmatter metadata is refreshed from the bundled package. Result:
new Houston-built workflows appear in existing agents, Skill cards can
be updated across releases, and local procedure edits stay intact.

### Migrations (renaming or removing Skills across versions)

Net-new Skills are picked up automatically. **Renaming** a packaged
Skill's slug (or removing it) is different — without help, users end
up with old + new copies side-by-side in their picker. To handle this
cleanly, each agent package can ship a `.migrations.json` at its root
listing the rename steps between published versions:

```json
[
  {
    "from": "0.1.4",
    "to": "0.2.0",
    "renames": {
      "old-slug": "new-slug"
    }
  }
]
```

On sync, the engine reads `.migrations.json` and, for each user
workspace agent of that `config_id`:

1. Reads the workspace's last-synced bundled version from
   `.houston/bundled-package.json` (or treats the install as
   pre-migration if absent).
2. Picks every migration step whose `to` version is ≤ the current
   bundled version and (when a marker exists) > the workspace's last
   synced version.
3. For each rename, if the old slug exists in the workspace:
   - **New slug doesn't exist yet** → rename the directory in place.
     The user's body content is preserved; only the directory name
     and the `name:` frontmatter field change. The existing
     metadata-refresh step then updates the description, inputs,
     prompt template etc. on the renamed skill.
   - **New slug already exists** (because a prior sync without
     migrations ran) → delete the old slug. The bundled package no
     longer ships it and every cross-reference points at the new
     slug, so it's orphaned dead weight. Keeping it would just leave
     a duplicate card in the picker.
4. Writes `.houston/bundled-package.json` with the new version, so
   the next sync starts from there.

Author the migration step in the same release that does the rename.
Forgetting it means existing users see duplicates until they delete
the old one by hand.

If a release ships migrations *late* (the rename was published in v0.2.0
but `.migrations.json` only landed in v0.2.1), include a follow-up
migration step in v0.2.1 with the same renames so users whose marker
already says "0.2.0" still get the cleanup. The renames are idempotent
so there's no harm in repeating them.

User-created sharing is intentionally separate. Future community store
work should add publish/share flow without requiring GitHub.

## Relation to other products

- **Houston App** consumes Store in the New Agent dialog.
- **Engine** owns install/update mechanics through `/v1/store/*`.
- **Store** is static content in this repo today, not a hosted service.
