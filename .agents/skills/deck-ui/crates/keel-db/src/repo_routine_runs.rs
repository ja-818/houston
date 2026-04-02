use crate::db::Database;
use crate::models::RoutineRun;
use anyhow::{Context, Result};

impl Database {
    pub async fn create_routine_run(
        &self,
        run_id: &str,
        routine_id: &str,
    ) -> Result<()> {
        let now = chrono::Utc::now().to_rfc3339();

        self.conn()
            .execute(
                "INSERT INTO routine_runs (id, routine_id, project_id, status, created_at)
                 VALUES (?1, ?2, (SELECT project_id FROM routines WHERE id = ?2), 'running', ?3)",
                libsql::params![run_id.to_string(), routine_id.to_string(), now],
            )
            .await
            .context("Failed to create routine run")?;

        // Increment run_count on the routine.
        self.conn()
            .execute(
                "UPDATE routines SET run_count = run_count + 1, updated_at = ?1 WHERE id = ?2",
                libsql::params![
                    chrono::Utc::now().to_rfc3339(),
                    routine_id.to_string()
                ],
            )
            .await
            .context("Failed to increment run count")?;

        Ok(())
    }

    pub async fn list_routine_runs(
        &self,
        routine_id: &str,
        limit: i64,
    ) -> Result<Vec<RoutineRun>> {
        let mut rows = self
            .conn()
            .query(
                "SELECT id, routine_id, status,
                        COALESCE(output_summary, '') AS output_summary,
                        created_at, completed_at
                 FROM routine_runs
                 WHERE routine_id = ?1
                 ORDER BY created_at DESC
                 LIMIT ?2",
                libsql::params![routine_id.to_string(), limit],
            )
            .await
            .context("Failed to list routine runs")?;

        let mut runs = Vec::new();
        while let Some(row) = rows.next().await? {
            runs.push(RoutineRun {
                id: row.get(0)?,
                routine_id: row.get(1)?,
                status: row.get(2)?,
                output_summary: row.get::<String>(3).ok().filter(|s| !s.is_empty()),
                created_at: row.get(4)?,
                completed_at: row.get::<String>(5).ok(),
            });
        }
        Ok(runs)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    async fn setup_with_routine() -> (Database, String, String) {
        let db = Database::connect_in_memory().await.unwrap();
        let project = db.create_project("P", "/tmp/p").await.unwrap();
        let routine_id = uuid::Uuid::new_v4().to_string();
        db.create_routine(&routine_id, &project.id, "R", "", "daily", "{}")
            .await
            .unwrap();
        (db, project.id, routine_id)
    }

    #[tokio::test]
    async fn create_run_increments_count() {
        let (db, _project_id, routine_id) = setup_with_routine().await;

        let run_id = uuid::Uuid::new_v4().to_string();
        db.create_routine_run(&run_id, &routine_id).await.unwrap();

        let routine = db.get_routine(&routine_id).await.unwrap().unwrap();
        assert_eq!(routine.run_count, 1);

        let runs = db.list_routine_runs(&routine_id, 10).await.unwrap();
        assert_eq!(runs.len(), 1);
        assert_eq!(runs[0].status, "running");
    }

    #[tokio::test]
    async fn list_routine_runs_empty() {
        let (db, _project_id, routine_id) = setup_with_routine().await;

        let runs = db.list_routine_runs(&routine_id, 10).await.unwrap();
        assert!(runs.is_empty());
    }
}
