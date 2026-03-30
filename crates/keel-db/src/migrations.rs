use crate::db::Database;
use anyhow::Result;

impl Database {
    /// Run base migrations for the generic Keel tables.
    /// Application-specific migrations should be run separately by the consuming app.
    pub(crate) async fn run_migrations(&self) -> Result<()> {
        // Issues table (kanban cards).
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

        // Issue dependencies (many-to-many blocking relationships).
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

        // Issue feed persistence (survives app restart).
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

        // Routines: recurring autonomous tasks.
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

        Ok(())
    }
}
