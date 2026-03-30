---
name: keel
description: CLI for managing the task board and routines
invariants:
  - Always pass --db-path to specify the SQLite database
  - Always pass --project-id for task commands
  - Routine subcommands that operate on a specific routine take the ID as a positional arg
  - Use --exclude-issue to hide conversation tracking issues from list output
  - Output is JSON by default — parse it directly
  - Use --pretty only for human debugging
  - Errors go to stderr with exit code 1
  - Success outputs JSON to stdout with exit code 0
---

# keel CLI

CLI for managing AI agent tasks and routines. Replaces the MCP server with direct bash commands.

## Global Flags

```bash
--db-path PATH        # Path to SQLite database (required)
--project-id ID       # Project scope (required for task commands)
--exclude-issue ID    # Hide this issue from list output
--pretty              # Pretty-print JSON output
```

## Task Management

```bash
# Create a task
keel --db-path DB --project-id PID task create --title "Build feature X" --description "Details..." --tags "rust,backend"

# Create a task with dependencies (blocked until deps are done)
keel --db-path DB --project-id PID task create --title "Deploy" --depends-on "id1,id2"

# List all tasks
keel --db-path DB --project-id PID task list

# List tasks filtered by status
keel --db-path DB --project-id PID task list --status running

# Update a task
keel --db-path DB --project-id PID task update TASK_ID --title "New title" --status done

# Delete a task
keel --db-path DB --project-id PID task delete TASK_ID
```

### Task Statuses
- `queue` — Waiting to start
- `running` — Agent is working on it
- `needs_you` — Requires human review
- `done` — Completed
- `cancelled` — Cancelled

## Routine Management

```bash
# Create a routine
keel --db-path DB routine create --project-id PID --name "Daily digest" --trigger daily --description "Summarize activity"

# List routines
keel --db-path DB routine list --project-id PID

# Update a routine
keel --db-path DB routine update ROUTINE_ID --name "Weekly digest" --trigger weekly

# Pause/resume
keel --db-path DB routine pause ROUTINE_ID
keel --db-path DB routine resume ROUTINE_ID

# View run history
keel --db-path DB routine history ROUTINE_ID --limit 5

# Start a run manually
keel --db-path DB routine run ROUTINE_ID

# Delete a routine
keel --db-path DB routine delete ROUTINE_ID
```

### Routine Trigger Types
- `manual` — Only runs when explicitly triggered
- `daily` — Runs once per day
- `weekly` — Runs once per week
- `on_change` — Runs when something changes

## Schema Introspection

```bash
# List all available commands and their parameters
keel --db-path DB schema

# Get schema for a specific command
keel --db-path DB schema task.create
```

## Output Format

All commands output JSON. Example task:
```json
{
  "id": "abc-123",
  "title": "Build feature X",
  "description": "Details...",
  "status": "running",
  "tags": ["rust", "backend"],
  "blocked_by": [],
  "created_at": "2026-03-30T10:00:00Z",
  "updated_at": "2026-03-30T10:00:00Z"
}
```

Example error (on stderr):
```json
{"error": "Task not found: invalid-id"}
```
