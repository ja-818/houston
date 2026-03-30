use anyhow::{Context, Result};
use libsql::Connection;

/// Create the memories table, indexes, FTS5 virtual table, and sync triggers.
pub async fn run_migrations(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS memories (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            content TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'fact',
            source TEXT NOT NULL DEFAULT 'agent',
            tags TEXT NOT NULL DEFAULT '[]',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_memories_project
            ON memories(project_id);

        CREATE INDEX IF NOT EXISTS idx_memories_category
            ON memories(project_id, category);",
    )
    .await
    .context("Failed to create memories table")?;

    // FTS5 virtual table for full-text search.
    conn.execute_batch(
        "CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
            content,
            tags,
            content=memories,
            content_rowid=rowid
        );",
    )
    .await
    .context("Failed to create memories_fts virtual table")?;

    // Triggers to keep FTS index in sync with the memories table.
    conn.execute_batch(
        "CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
            INSERT INTO memories_fts(rowid, content, tags)
                VALUES (new.rowid, new.content, new.tags);
        END;

        CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
            INSERT INTO memories_fts(memories_fts, rowid, content, tags)
                VALUES('delete', old.rowid, old.content, old.tags);
        END;

        CREATE TRIGGER IF NOT EXISTS memories_au AFTER UPDATE ON memories BEGIN
            INSERT INTO memories_fts(memories_fts, rowid, content, tags)
                VALUES('delete', old.rowid, old.content, old.tags);
            INSERT INTO memories_fts(rowid, content, tags)
                VALUES (new.rowid, new.content, new.tags);
        END;",
    )
    .await
    .context("Failed to create FTS sync triggers")?;

    tracing::debug!("keel-memory migrations complete");
    Ok(())
}
