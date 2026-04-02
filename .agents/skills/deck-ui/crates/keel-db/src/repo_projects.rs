use crate::db::Database;
use crate::models::Project;
use anyhow::{Context, Result};

impl Database {
    pub async fn create_project(&self, name: &str, folder_path: &str) -> Result<Project> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();

        self.conn()
            .execute(
                "INSERT INTO projects (id, name, folder_path, pm_instructions, created_at, updated_at)
             VALUES (?1, ?2, ?3, '', ?4, ?5)",
                libsql::params![
                    id.clone(),
                    name.to_string(),
                    folder_path.to_string(),
                    now.clone(),
                    now.clone()
                ],
            )
            .await
            .context("Failed to create project")?;

        Ok(Project {
            id,
            name: name.to_string(),
            folder_path: folder_path.to_string(),
            pm_instructions: String::new(),
            created_at: now.clone(),
            updated_at: now,
        })
    }

    pub async fn get_project(&self, id: &str) -> Result<Option<Project>> {
        let mut rows = self
            .conn()
            .query(
                "SELECT id, name, folder_path, pm_instructions, created_at, updated_at
             FROM projects WHERE id = ?1",
                [id],
            )
            .await?;

        match rows.next().await? {
            Some(row) => Ok(Some(Self::row_to_project(&row)?)),
            None => Ok(None),
        }
    }

    pub async fn list_projects(&self) -> Result<Vec<Project>> {
        let mut rows = self
            .conn()
            .query(
                "SELECT id, name, folder_path, pm_instructions, created_at, updated_at
             FROM projects ORDER BY created_at ASC",
                (),
            )
            .await
            .context("Failed to list projects")?;

        let mut projects = Vec::new();
        while let Some(row) = rows.next().await? {
            projects.push(Self::row_to_project(&row)?);
        }
        Ok(projects)
    }

    pub async fn update_project(
        &self,
        id: &str,
        name: &str,
        folder_path: &str,
    ) -> Result<bool> {
        let now = chrono::Utc::now().to_rfc3339();
        let affected = self
            .conn()
            .execute(
                "UPDATE projects SET name = ?1, folder_path = ?2, updated_at = ?3
             WHERE id = ?4",
                libsql::params![
                    name.to_string(),
                    folder_path.to_string(),
                    now,
                    id.to_string()
                ],
            )
            .await
            .context("Failed to update project")?;
        Ok(affected > 0)
    }

    pub async fn update_pm_instructions(&self, id: &str, instructions: &str) -> Result<bool> {
        let now = chrono::Utc::now().to_rfc3339();
        let affected = self
            .conn()
            .execute(
                "UPDATE projects SET pm_instructions = ?1, updated_at = ?2
             WHERE id = ?3",
                libsql::params![instructions.to_string(), now, id.to_string()],
            )
            .await
            .context("Failed to update PM instructions")?;
        Ok(affected > 0)
    }

    pub async fn delete_project(&self, id: &str) -> Result<bool> {
        let tx = self
            .conn()
            .transaction()
            .await
            .context("Failed to begin transaction for delete_project")?;

        // Delete children that reference this project.
        tx.execute("DELETE FROM issues WHERE project_id = ?1", [id])
            .await?;
        let affected = tx.execute("DELETE FROM projects WHERE id = ?1", [id]).await?;

        tx.commit()
            .await
            .context("Failed to commit delete_project")?;
        Ok(affected > 0)
    }

    fn row_to_project(row: &libsql::Row) -> Result<Project> {
        Ok(Project {
            id: row.get::<String>(0)?,
            name: row.get::<String>(1)?,
            folder_path: row.get::<String>(2)?,
            pm_instructions: row.get::<String>(3).unwrap_or_default(),
            created_at: row.get::<String>(4)?,
            updated_at: row.get::<String>(5)?,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn create_and_get_project() {
        let db = Database::connect_in_memory().await.unwrap();
        let project = db
            .create_project("Test Project", "/tmp/test")
            .await
            .unwrap();
        assert_eq!(project.name, "Test Project");
        assert_eq!(project.folder_path, "/tmp/test");
        assert_eq!(project.pm_instructions, "");

        let fetched = db.get_project(&project.id).await.unwrap().unwrap();
        assert_eq!(fetched.id, project.id);
        assert_eq!(fetched.name, "Test Project");
    }

    #[tokio::test]
    async fn list_projects() {
        let db = Database::connect_in_memory().await.unwrap();
        db.create_project("Alpha", "/tmp/a").await.unwrap();
        db.create_project("Beta", "/tmp/b").await.unwrap();

        let projects = db.list_projects().await.unwrap();
        assert_eq!(projects.len(), 2);
        assert_eq!(projects[0].name, "Alpha");
        assert_eq!(projects[1].name, "Beta");
    }

    #[tokio::test]
    async fn update_project() {
        let db = Database::connect_in_memory().await.unwrap();
        let project = db.create_project("Old", "/tmp/old").await.unwrap();

        let updated = db
            .update_project(&project.id, "New", "/tmp/new")
            .await
            .unwrap();
        assert!(updated);

        let fetched = db.get_project(&project.id).await.unwrap().unwrap();
        assert_eq!(fetched.name, "New");
        assert_eq!(fetched.folder_path, "/tmp/new");
    }

    #[tokio::test]
    async fn update_pm_instructions() {
        let db = Database::connect_in_memory().await.unwrap();
        let project = db.create_project("P", "/tmp/p").await.unwrap();

        db.update_pm_instructions(&project.id, "Be concise")
            .await
            .unwrap();
        let fetched = db.get_project(&project.id).await.unwrap().unwrap();
        assert_eq!(fetched.pm_instructions, "Be concise");
    }

    #[tokio::test]
    async fn delete_project() {
        let db = Database::connect_in_memory().await.unwrap();
        let project = db.create_project("Doomed", "/tmp/doom").await.unwrap();

        let deleted = db.delete_project(&project.id).await.unwrap();
        assert!(deleted);

        let fetched = db.get_project(&project.id).await.unwrap();
        assert!(fetched.is_none());
    }

    #[tokio::test]
    async fn get_nonexistent_project() {
        let db = Database::connect_in_memory().await.unwrap();
        let fetched = db.get_project("nonexistent").await.unwrap();
        assert!(fetched.is_none());
    }

    #[tokio::test]
    async fn delete_project_cascades_issues() {
        let db = Database::connect_in_memory().await.unwrap();
        let project = db.create_project("Cascade", "/tmp/c").await.unwrap();
        db.create_issue(&project.id, "Issue 1", "desc", None)
            .await
            .unwrap();

        db.delete_project(&project.id).await.unwrap();

        let issues = db.list_issues(&project.id).await.unwrap();
        assert!(issues.is_empty());
    }
}
