use crate::db::Database;
use crate::issue_types::IssueStatus;
use crate::models::Issue;
use anyhow::{Context, Result};

impl Database {
    pub async fn create_issue(
        &self,
        project_id: &str,
        title: &str,
        description: &str,
        tags: Option<&str>,
    ) -> Result<Issue> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();

        // Position = count of existing issues in this project.
        let mut rows = self
            .conn()
            .query(
                "SELECT COUNT(*) FROM issues WHERE project_id = ?1",
                [project_id],
            )
            .await?;
        let position: i32 = match rows.next().await? {
            Some(row) => row.get::<i64>(0).unwrap_or(0) as i32,
            None => 0,
        };

        self.conn()
            .execute(
                "INSERT INTO issues (id, project_id, title, description, status, tags, position, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
                libsql::params![
                    id.clone(),
                    project_id.to_string(),
                    title.to_string(),
                    description.to_string(),
                    IssueStatus::Running.to_string(),
                    tags.unwrap_or("").to_string(),
                    position as i64,
                    now.clone(),
                    now.clone()
                ],
            )
            .await
            .context("Failed to create issue")?;

        Ok(Issue {
            id,
            project_id: project_id.to_string(),
            title: title.to_string(),
            description: description.to_string(),
            status: IssueStatus::Running,
            tags: tags.map(|s| s.to_string()),
            position,
            session_id: None,
            claude_session_id: None,
            output_files: None,
            created_at: now.clone(),
            updated_at: now,
            blocked_by_ids: vec![],
        })
    }

    pub async fn get_issue(&self, id: &str) -> Result<Option<Issue>> {
        let mut rows = self
            .conn()
            .query(
                "SELECT id, project_id, title, description, status, tags, position,
                        session_id, claude_session_id, output_files, created_at, updated_at
                 FROM issues WHERE id = ?1",
                [id],
            )
            .await?;
        let Some(row) = rows.next().await? else {
            return Ok(None);
        };
        let mut issue = Self::row_to_issue(&row)?;
        issue.blocked_by_ids = self.list_issue_dependencies(id).await?;
        Ok(Some(issue))
    }

    pub async fn list_issues(&self, project_id: &str) -> Result<Vec<Issue>> {
        let mut rows = self
            .conn()
            .query(
                "SELECT id, project_id, title, description, status, tags, position,
                        session_id, claude_session_id, output_files, created_at, updated_at
                 FROM issues WHERE project_id = ?1
                 ORDER BY position ASC, created_at ASC",
                [project_id],
            )
            .await
            .context("Failed to list issues")?;

        let mut issues = Vec::new();
        while let Some(row) = rows.next().await? {
            issues.push(Self::row_to_issue(&row)?);
        }

        // Populate blocked_by_ids for all issues in one batch query.
        let mut dep_map = self.load_deps_for_project(project_id).await?;
        for issue in &mut issues {
            if let Some(deps) = dep_map.remove(&issue.id) {
                issue.blocked_by_ids = deps;
            }
        }
        Ok(issues)
    }

    pub async fn delete_issue(&self, id: &str) -> Result<bool> {
        let affected = self
            .conn()
            .execute("DELETE FROM issues WHERE id = ?1", [id])
            .await
            .context("Failed to delete issue")?;
        Ok(affected > 0)
    }

    pub(crate) fn row_to_issue(row: &libsql::Row) -> Result<Issue> {
        let status_str: String = row.get(4)?;
        Ok(Issue {
            id: row.get(0)?,
            project_id: row.get(1)?,
            title: row.get(2)?,
            description: row.get(3)?,
            status: status_str
                .parse::<IssueStatus>()
                .unwrap_or(IssueStatus::Queue),
            tags: row.get::<String>(5).ok().filter(|s| !s.is_empty()),
            position: row.get::<i64>(6).unwrap_or(0) as i32,
            session_id: row.get::<String>(7).ok().filter(|s| !s.is_empty()),
            claude_session_id: row.get::<String>(8).ok().filter(|s| !s.is_empty()),
            output_files: row.get::<String>(9).ok().filter(|s| !s.is_empty()),
            created_at: row.get(10)?,
            updated_at: row.get(11)?,
            blocked_by_ids: vec![],
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn create_and_get_issue() {
        let db = Database::connect_in_memory().await.unwrap();
        let project = db.create_project("P", "/tmp/p").await.unwrap();
        let issue = db
            .create_issue(&project.id, "Fix bug", "Details", None)
            .await
            .unwrap();
        assert_eq!(issue.title, "Fix bug");
        assert_eq!(issue.status, IssueStatus::Running);
        assert_eq!(issue.position, 0);

        let fetched = db.get_issue(&issue.id).await.unwrap().unwrap();
        assert_eq!(fetched.id, issue.id);
        assert_eq!(fetched.title, "Fix bug");
    }

    #[tokio::test]
    async fn list_issues_scoped_by_project() {
        let db = Database::connect_in_memory().await.unwrap();
        let p1 = db.create_project("P1", "/tmp/p1").await.unwrap();
        let p2 = db.create_project("P2", "/tmp/p2").await.unwrap();

        db.create_issue(&p1.id, "A", "", None).await.unwrap();
        db.create_issue(&p1.id, "B", "", None).await.unwrap();
        db.create_issue(&p2.id, "C", "", None).await.unwrap();

        let p1_issues = db.list_issues(&p1.id).await.unwrap();
        assert_eq!(p1_issues.len(), 2);
        let p2_issues = db.list_issues(&p2.id).await.unwrap();
        assert_eq!(p2_issues.len(), 1);
    }

    #[tokio::test]
    async fn delete_issue() {
        let db = Database::connect_in_memory().await.unwrap();
        let project = db.create_project("P", "/tmp/p").await.unwrap();
        let issue = db
            .create_issue(&project.id, "Doomed", "", None)
            .await
            .unwrap();

        let deleted = db.delete_issue(&issue.id).await.unwrap();
        assert!(deleted);
        assert!(db.get_issue(&issue.id).await.unwrap().is_none());
    }

    #[tokio::test]
    async fn tags_roundtrip() {
        let db = Database::connect_in_memory().await.unwrap();
        let project = db.create_project("P", "/tmp/p").await.unwrap();
        let tags_json = serde_json::to_string(&vec!["rust", "bug"]).unwrap();
        let issue = db
            .create_issue(&project.id, "Tagged", "", Some(&tags_json))
            .await
            .unwrap();

        let fetched = db.get_issue(&issue.id).await.unwrap().unwrap();
        let tags = fetched.parsed_tags();
        assert_eq!(tags, vec!["rust", "bug"]);
    }

    #[tokio::test]
    async fn position_auto_increments() {
        let db = Database::connect_in_memory().await.unwrap();
        let project = db.create_project("P", "/tmp/p").await.unwrap();
        let i1 = db
            .create_issue(&project.id, "First", "", None)
            .await
            .unwrap();
        let i2 = db
            .create_issue(&project.id, "Second", "", None)
            .await
            .unwrap();
        assert_eq!(i1.position, 0);
        assert_eq!(i2.position, 1);
    }
}
