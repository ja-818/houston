use crate::db::Database;
use anyhow::Result;

impl Database {
    /// Run base migrations for the generic Keel tables.
    /// Application-specific migrations should be run separately by the consuming app.
    pub(crate) async fn run_migrations(&self) -> Result<()> {
        // DEPRECATED (v2): Issues table moves to .keel/tasks.json.
        // Kept for backward compat during migration period.
        self.conn()
            .execute_batch(
                "CREATE TABLE IF NOT EXISTS issues (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL REFERENCES projects(id),
                title TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL DEFAULT 'queue',
                tags TEXT,
                position INTEGER NOT NULL DEFAULT 0,
                session_id TEXT,
                claude_session_id TEXT,
                output_files TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );",
            )
            .await
            .ok();

        // DEPRECATED (v2): Issue dependencies removed in v2.
        // Kept for backward compat during migration period.
        self.conn()
            .execute_batch(
                "CREATE TABLE IF NOT EXISTS issue_dependencies (
                issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
                depends_on_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
                PRIMARY KEY (issue_id, depends_on_id)
            );",
            )
            .await
            .ok();

        // DEPRECATED (v2): Issue feed merged into chat_feed (keyed by claude_session_id).
        // Kept for backward compat during migration period.
        self.conn()
            .execute_batch(
                "CREATE TABLE IF NOT EXISTS issue_feed_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                issue_id TEXT NOT NULL,
                feed_type TEXT NOT NULL,
                data_json TEXT NOT NULL,
                timestamp TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_issue_feed_issue_id ON issue_feed_items(issue_id);",
            )
            .await
            .ok();

        // Projects: pm_instructions column.
        let _ = self
            .conn()
            .execute(
                "ALTER TABLE projects ADD COLUMN pm_instructions TEXT NOT NULL DEFAULT ''",
                (),
            )
            .await;

        // Projects: icon column.
        let _ = self
            .conn()
            .execute(
                "ALTER TABLE projects ADD COLUMN icon TEXT NOT NULL DEFAULT 'rocket'",
                (),
            )
            .await;

        // DEPRECATED (v2): Routines move to .keel/routines.json.
        // Kept for backward compat during migration period.
        self.conn()
            .execute_batch(
                "CREATE TABLE IF NOT EXISTS routines (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL REFERENCES projects(id),
                name TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                trigger_type TEXT NOT NULL DEFAULT 'daily',
                schedule_type TEXT NOT NULL DEFAULT 'daily',
                trigger_config TEXT NOT NULL DEFAULT '{}',
                status TEXT NOT NULL DEFAULT 'active',
                schedule_time TEXT NOT NULL DEFAULT '09:00',
                autonomy TEXT NOT NULL DEFAULT 'notify',
                enabled INTEGER NOT NULL DEFAULT 1,
                is_system INTEGER NOT NULL DEFAULT 0,
                run_count INTEGER NOT NULL DEFAULT 0,
                approval_count INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS routine_runs (
                id TEXT PRIMARY KEY,
                routine_id TEXT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
                project_id TEXT NOT NULL REFERENCES projects(id),
                status TEXT NOT NULL DEFAULT 'running',
                output_summary TEXT,
                created_at TEXT NOT NULL,
                completed_at TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_routine_runs_routine
                ON routine_runs(routine_id);",
            )
            .await
            .ok();

        // DEPRECATED (v2): Event log moves to .keel/log.jsonl.
        // Kept for backward compat during migration period.
        self.conn()
            .execute_batch(
                "CREATE TABLE IF NOT EXISTS event_log (
                id TEXT PRIMARY KEY,
                event_type TEXT NOT NULL,
                source_channel TEXT NOT NULL,
                source_identifier TEXT NOT NULL,
                payload TEXT NOT NULL DEFAULT '{}',
                session_key TEXT,
                project_id TEXT,
                status TEXT NOT NULL DEFAULT 'pending',
                summary TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                processed_at TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_event_log_project ON event_log(project_id);
            CREATE INDEX IF NOT EXISTS idx_event_log_type ON event_log(event_type);
            CREATE INDEX IF NOT EXISTS idx_event_log_created ON event_log(created_at);",
            )
            .await
            .ok();

        // DEPRECATED (v2): Webhooks removed in v2.
        // Kept for backward compat during migration period.
        self.conn()
            .execute_batch(
                "CREATE TABLE IF NOT EXISTS webhooks (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                endpoint_path TEXT NOT NULL UNIQUE,
                secret TEXT,
                enabled INTEGER NOT NULL DEFAULT 1,
                project_id TEXT REFERENCES projects(id),
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );",
            )
            .await
            .ok();

        // DEPRECATED (v2): Channels move to .keel/channels.json.
        // Kept for backward compat during migration period.
        self.conn()
            .execute_batch(
                "CREATE TABLE IF NOT EXISTS channels (
                id TEXT PRIMARY KEY,
                channel_type TEXT NOT NULL,
                name TEXT NOT NULL,
                config TEXT NOT NULL DEFAULT '{}',
                status TEXT NOT NULL DEFAULT 'disconnected',
                enabled INTEGER NOT NULL DEFAULT 1,
                last_active_at TEXT,
                message_count INTEGER NOT NULL DEFAULT 0,
                error TEXT,
                project_id TEXT REFERENCES projects(id),
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );",
            )
            .await
            .ok();

        // Chat feed persistence (main conversation history across app restarts).
        self.conn()
            .execute_batch(
                "CREATE TABLE IF NOT EXISTS chat_feed (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id TEXT NOT NULL,
                feed_key TEXT NOT NULL DEFAULT 'main',
                feed_type TEXT NOT NULL,
                data_json TEXT NOT NULL,
                source TEXT NOT NULL DEFAULT 'desktop',
                timestamp TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_chat_feed_project_key
                ON chat_feed(project_id, feed_key);",
            )
            .await
            .ok();

        // v2 migration: add claude_session_id to chat_feed for session-keyed lookups.
        // Existing rows will have NULL — backward compatible.
        let _ = self
            .conn()
            .execute(
                "ALTER TABLE chat_feed ADD COLUMN claude_session_id TEXT",
                (),
            )
            .await;

        self.conn()
            .execute_batch(
                "CREATE INDEX IF NOT EXISTS idx_chat_feed_session
                    ON chat_feed(claude_session_id);",
            )
            .await
            .ok();

        Ok(())
    }
}
