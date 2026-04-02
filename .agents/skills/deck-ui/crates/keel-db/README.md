# keel-db

SQLite database layer for AI agent desktop apps. Local-first persistence via libsql with automatic migrations and typed repositories.

## Install

```toml
[dependencies]
keel-db = "0.1"
```

## Usage

```rust
use keel_db::{Database, Project, Issue, IssueStatus};

// Open (or create) the database
let db = Database::open("~/.myapp/data.db").await?;

// Create a project
let project = repo_projects::create(&db, "My Project").await?;

// Create an issue
let issue = repo_issues::create(&db, &project.id, "Fix auth flow").await?;

// Query by status
let running = repo_issues::list_by_status(&db, IssueStatus::Running).await?;
```

## Modules

- `db` -- `Database` struct wrapping libsql connection
- `migrations` -- automatic schema migrations on open
- `models` -- `Project`, `Issue`, `Session`, `SessionEvent` structs
- `issue_types` -- `IssueStatus` enum with Display/FromStr
- `repo_projects` -- project CRUD
- `repo_issues` -- issue CRUD and queries
- `repo_issues_update` -- issue field updates
- `repo_issue_deps` -- issue dependency (blocked-by) relationships
- `repo_issue_feed` -- issue feed/activity log
- `repo_sessions` -- session lifecycle persistence
- `repo_session_events` -- session event storage

## Key Types

- `Database` -- connection wrapper with migration support
- `Project`, `Issue`, `Session`, `SessionEvent` -- domain models
- `IssueStatus` -- typed enum (Todo, Running, NeedsYou, Completed, Failed, etc.)
- `IssueFeedRow` -- activity feed entry

---

Part of [Keel & Deck](../../README.md).
