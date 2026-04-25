use crate::db::Database;
use anyhow::Result;

impl Database {
    /// Run base migrations for the generic Houston tables.
    /// Application-specific migrations should be run separately by the consuming app.
    pub(crate) async fn run_migrations(&self) -> Result<()> {
        // chat_feed table — session-keyed by claude_session_id. No project_id/feed_key
        // legacy columns: every conversation is scoped by its Claude session.
        self.conn()
            .execute_batch(
                "CREATE TABLE IF NOT EXISTS chat_feed (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    claude_session_id TEXT NOT NULL,
                    feed_type TEXT NOT NULL,
                    data_json TEXT NOT NULL,
                    source TEXT NOT NULL DEFAULT 'desktop',
                    timestamp TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_chat_feed_session
                    ON chat_feed(claude_session_id);",
            )
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

        // engine_tokens — device-scoped bearer tokens minted during pairing.
        // Stored as SHA-256 hash (never the plaintext). `revoked_at` null
        // means live. The bootstrap token (from HOUSTON_ENGINE_TOKEN or the
        // auto-gen in config) is NOT in this table — it's checked separately.
        self.conn()
            .execute_batch(
                "CREATE TABLE IF NOT EXISTS engine_tokens (
                    token_hash TEXT PRIMARY KEY,
                    device_label TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    revoked_at TEXT,
                    last_seen_at TEXT
                );
                CREATE INDEX IF NOT EXISTS idx_engine_tokens_active
                    ON engine_tokens(revoked_at);",
            )
            .await
            .ok();

        Ok(())
    }
}
