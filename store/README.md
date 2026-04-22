# Houston Store

Registry of pre-built agents. No start-from-zero.

## What it is
Repo of agent manifests (`houston.json` + `CLAUDE.md` + optional `bundle.js` + icon). Users browse, install into their workspace w/ one click.

## Status
**TBD — placeholder.** Directory exists to reserve the name. No code yet.

## Planned
- Curated index of agent definitions
- Categories (research, ops, content, code, etc.)
- Install via "New Agent → Store" dialog in Houston App
- Workspace templates (bundled multi-agent repos)

## Relation to other products
- **Houston App** consumes Store for agent installation
- **Engine** doesn't know Store exists — it just runs whatever manifest loads
- Not a separate service — static registry in this monorepo
