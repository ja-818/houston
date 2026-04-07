use crate::db::Database;
use anyhow::Result;

impl Database {
    /// Run base migrations for the generic Houston tables.
    /// Application-specific migrations should be run separately by the consuming app.
    pub(crate) async fn run_migrations(&self) -> Result<()> {
        // chat_feed table with claude_session_id column.
        self.conn()
            .execute_batch(
                "CREATE TABLE IF NOT EXISTS chat_feed (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id TEXT NOT NULL,
                feed_key TEXT NOT NULL DEFAULT 'main',
                feed_type TEXT NOT NULL,
                data_json TEXT NOT NULL,
                source TEXT NOT NULL DEFAULT 'desktop',
                claude_session_id TEXT,
                timestamp TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_chat_feed_project_key
                ON chat_feed(project_id, feed_key);
            CREATE INDEX IF NOT EXISTS idx_chat_feed_session
                ON chat_feed(claude_session_id);",
            )
            .await
            .ok();

        // Add claude_session_id column to existing databases (no-op if already present).
        self.conn()
            .execute("ALTER TABLE chat_feed ADD COLUMN claude_session_id TEXT", ())
            .await
            .ok();

        // FTS5 full-text search index over chat messages.
        // Standalone table (no content=) so snippet() works and we control sync via triggers.
        self.conn()
            .execute_batch(
                "CREATE VIRTUAL TABLE IF NOT EXISTS chat_feed_fts USING fts5(
                    content,
                    tokenize='unicode61 remove_diacritics 2'
                );

                CREATE TRIGGER IF NOT EXISTS chat_feed_fts_insert
                AFTER INSERT ON chat_feed BEGIN
                    INSERT INTO chat_feed_fts(rowid, content)
                    VALUES (new.id, new.data_json);
                END;

                CREATE TRIGGER IF NOT EXISTS chat_feed_fts_delete
                AFTER DELETE ON chat_feed BEGIN
                    INSERT INTO chat_feed_fts(chat_feed_fts, rowid, content)
                    VALUES('delete', old.id, old.data_json);
                END;",
            )
            .await
            .ok();

        Ok(())
    }
}
