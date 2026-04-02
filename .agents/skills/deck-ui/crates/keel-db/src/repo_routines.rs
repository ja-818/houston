use crate::db::Database;
use crate::models::Routine;
use anyhow::{Context, Result};

impl Database {
    pub async fn create_routine(
        &self,
        id: &str,
        project_id: &str,
        name: &str,
        description: &str,
        trigger_type: &str,
        trigger_config: &str,
    ) -> Result<Routine> {
        let now = chrono::Utc::now().to_rfc3339();

        self.conn()
            .execute(
                "INSERT INTO routines (id, project_id, name, title,
                 description, trigger_type, schedule_type, trigger_config,
                 status, run_count, approval_count,
                 schedule_time, autonomy, enabled, is_system,
                 created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?3, ?4, ?5, ?5, ?6,
                         'active', 0, 0,
                         '09:00', 'notify', 1, 0,
                         ?7, ?8)",
                libsql::params![
                    id.to_string(),
                    project_id.to_string(),
                    name.to_string(),
                    description.to_string(),
                    trigger_type.to_string(),
                    trigger_config.to_string(),
                    now.clone(),
                    now.clone()
                ],
            )
            .await
            .context("Failed to create routine")?;

        Ok(Routine {
            id: id.to_string(),
            project_id: project_id.to_string(),
            name: name.to_string(),
            description: description.to_string(),
            trigger_type: trigger_type.to_string(),
            trigger_config: trigger_config.to_string(),
            status: "active".to_string(),
            run_count: 0,
            approval_count: 0,
            created_at: now.clone(),
            updated_at: now,
        })
    }

    pub async fn get_routine(&self, id: &str) -> Result<Option<Routine>> {
        let mut rows = self
            .conn()
            .query(
                "SELECT id, project_id, COALESCE(name, title) AS name,
                        COALESCE(description, '') AS description,
                        COALESCE(trigger_type, schedule_type) AS trigger_type,
                        COALESCE(trigger_config, '{}') AS trigger_config,
                        COALESCE(status, 'active') AS status,
                        COALESCE(run_count, 0) AS run_count,
                        COALESCE(approval_count, 0) AS approval_count,
                        created_at, updated_at
                 FROM routines WHERE id = ?1",
                [id],
            )
            .await
            .context("Failed to get routine")?;

        match rows.next().await? {
            Some(row) => Ok(Some(Self::row_to_routine(&row)?)),
            None => Ok(None),
        }
    }

    pub async fn list_routines(&self, project_id: &str) -> Result<Vec<Routine>> {
        let mut rows = self
            .conn()
            .query(
                "SELECT id, project_id, COALESCE(name, title) AS name,
                        COALESCE(description, '') AS description,
                        COALESCE(trigger_type, schedule_type) AS trigger_type,
                        COALESCE(trigger_config, '{}') AS trigger_config,
                        COALESCE(status, 'active') AS status,
                        COALESCE(run_count, 0) AS run_count,
                        COALESCE(approval_count, 0) AS approval_count,
                        created_at, updated_at
                 FROM routines WHERE project_id = ?1
                 ORDER BY created_at ASC",
                [project_id],
            )
            .await
            .context("Failed to list routines")?;

        let mut routines = Vec::new();
        while let Some(row) = rows.next().await? {
            routines.push(Self::row_to_routine(&row)?);
        }
        Ok(routines)
    }

    pub async fn update_routine(
        &self,
        id: &str,
        name: &str,
        description: &str,
        trigger_type: &str,
        trigger_config: &str,
        status: &str,
    ) -> Result<bool> {
        let now = chrono::Utc::now().to_rfc3339();
        let affected = self
            .conn()
            .execute(
                "UPDATE routines SET name = ?1, title = ?1, description = ?2,
                 trigger_type = ?3, schedule_type = ?3,
                 trigger_config = ?4, status = ?5, updated_at = ?6
                 WHERE id = ?7",
                libsql::params![
                    name.to_string(),
                    description.to_string(),
                    trigger_type.to_string(),
                    trigger_config.to_string(),
                    status.to_string(),
                    now,
                    id.to_string()
                ],
            )
            .await
            .context("Failed to update routine")?;
        Ok(affected > 0)
    }

    pub async fn update_routine_status(&self, id: &str, status: &str) -> Result<bool> {
        let now = chrono::Utc::now().to_rfc3339();
        let affected = self
            .conn()
            .execute(
                "UPDATE routines SET status = ?1, updated_at = ?2 WHERE id = ?3",
                libsql::params![status.to_string(), now, id.to_string()],
            )
            .await
            .context("Failed to update routine status")?;
        Ok(affected > 0)
    }

    pub async fn delete_routine(&self, id: &str) -> Result<bool> {
        let affected = self
            .conn()
            .execute("DELETE FROM routines WHERE id = ?1", [id])
            .await
            .context("Failed to delete routine")?;
        Ok(affected > 0)
    }

    fn row_to_routine(row: &libsql::Row) -> Result<Routine> {
        Ok(Routine {
            id: row.get(0)?,
            project_id: row.get(1)?,
            name: row.get(2)?,
            description: row.get::<String>(3).unwrap_or_default(),
            trigger_type: row.get(4)?,
            trigger_config: row.get::<String>(5).unwrap_or_else(|_| "{}".into()),
            status: row.get(6)?,
            run_count: row.get::<i64>(7).unwrap_or(0),
            approval_count: row.get::<i64>(8).unwrap_or(0),
            created_at: row.get(9)?,
            updated_at: row.get(10)?,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    async fn setup() -> (Database, String) {
        let db = Database::connect_in_memory().await.unwrap();
        let project = db.create_project("P", "/tmp/p").await.unwrap();
        (db, project.id)
    }

    #[tokio::test]
    async fn create_and_get_routine() {
        let (db, project_id) = setup().await;
        let id = uuid::Uuid::new_v4().to_string();
        let routine = db
            .create_routine(&id, &project_id, "Daily digest", "Sum up", "daily", "{}")
            .await
            .unwrap();
        assert_eq!(routine.name, "Daily digest");
        assert_eq!(routine.status, "active");

        let fetched = db.get_routine(&id).await.unwrap().unwrap();
        assert_eq!(fetched.name, "Daily digest");
    }

    #[tokio::test]
    async fn list_routines_by_project() {
        let (db, project_id) = setup().await;
        let id1 = uuid::Uuid::new_v4().to_string();
        let id2 = uuid::Uuid::new_v4().to_string();
        db.create_routine(&id1, &project_id, "R1", "", "daily", "{}")
            .await
            .unwrap();
        db.create_routine(&id2, &project_id, "R2", "", "weekly", "{}")
            .await
            .unwrap();

        let list = db.list_routines(&project_id).await.unwrap();
        assert_eq!(list.len(), 2);
    }

    #[tokio::test]
    async fn update_routine_fields() {
        let (db, project_id) = setup().await;
        let id = uuid::Uuid::new_v4().to_string();
        db.create_routine(&id, &project_id, "Old", "", "daily", "{}")
            .await
            .unwrap();

        let updated = db
            .update_routine(&id, "New", "desc", "weekly", "{}", "active")
            .await
            .unwrap();
        assert!(updated);

        let fetched = db.get_routine(&id).await.unwrap().unwrap();
        assert_eq!(fetched.name, "New");
        assert_eq!(fetched.trigger_type, "weekly");
    }

    #[tokio::test]
    async fn pause_and_resume_routine() {
        let (db, project_id) = setup().await;
        let id = uuid::Uuid::new_v4().to_string();
        db.create_routine(&id, &project_id, "R", "", "daily", "{}")
            .await
            .unwrap();

        db.update_routine_status(&id, "paused").await.unwrap();
        let r = db.get_routine(&id).await.unwrap().unwrap();
        assert_eq!(r.status, "paused");

        db.update_routine_status(&id, "active").await.unwrap();
        let r = db.get_routine(&id).await.unwrap().unwrap();
        assert_eq!(r.status, "active");
    }

    #[tokio::test]
    async fn delete_routine_removes_it() {
        let (db, project_id) = setup().await;
        let id = uuid::Uuid::new_v4().to_string();
        db.create_routine(&id, &project_id, "Doomed", "", "daily", "{}")
            .await
            .unwrap();

        let deleted = db.delete_routine(&id).await.unwrap();
        assert!(deleted);
        assert!(db.get_routine(&id).await.unwrap().is_none());
    }

}
