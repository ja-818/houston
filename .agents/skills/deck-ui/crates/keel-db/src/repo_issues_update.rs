use crate::db::Database;
use crate::issue_types::IssueStatus;
use anyhow::Result;

impl Database {
    pub async fn update_issue_status(&self, id: &str, status: IssueStatus) -> Result<bool> {
        let now = chrono::Utc::now().to_rfc3339();
        let affected = self
            .conn()
            .execute(
                "UPDATE issues SET status = ?1, updated_at = ?2 WHERE id = ?3",
                libsql::params![status.to_string(), now, id.to_string()],
            )
            .await?;
        Ok(affected > 0)
    }

    pub async fn update_issue_tags(&self, id: &str, tags: &str) -> Result<bool> {
        let now = chrono::Utc::now().to_rfc3339();
        let affected = self
            .conn()
            .execute(
                "UPDATE issues SET tags = ?1, updated_at = ?2 WHERE id = ?3",
                libsql::params![tags.to_string(), now, id.to_string()],
            )
            .await?;
        Ok(affected > 0)
    }

    pub async fn update_issue_title_desc(
        &self,
        id: &str,
        title: &str,
        description: &str,
    ) -> Result<bool> {
        let now = chrono::Utc::now().to_rfc3339();
        let affected = self
            .conn()
            .execute(
                "UPDATE issues SET title = ?1, description = ?2, updated_at = ?3 WHERE id = ?4",
                libsql::params![
                    title.to_string(),
                    description.to_string(),
                    now,
                    id.to_string()
                ],
            )
            .await?;
        Ok(affected > 0)
    }

    pub async fn update_issue_session(&self, id: &str, session_id: &str) -> Result<bool> {
        let now = chrono::Utc::now().to_rfc3339();
        let affected = self
            .conn()
            .execute(
                "UPDATE issues SET session_id = ?1, updated_at = ?2 WHERE id = ?3",
                libsql::params![session_id.to_string(), now, id.to_string()],
            )
            .await?;
        Ok(affected > 0)
    }

    pub async fn update_issue_claude_session(
        &self,
        id: &str,
        claude_session_id: &str,
    ) -> Result<bool> {
        let now = chrono::Utc::now().to_rfc3339();
        let affected = self
            .conn()
            .execute(
                "UPDATE issues SET claude_session_id = ?1, updated_at = ?2 WHERE id = ?3",
                libsql::params![claude_session_id.to_string(), now, id.to_string()],
            )
            .await?;
        Ok(affected > 0)
    }

    pub async fn update_issue_title(&self, id: &str, title: &str) -> Result<bool> {
        let now = chrono::Utc::now().to_rfc3339();
        let affected = self
            .conn()
            .execute(
                "UPDATE issues SET title = ?1, updated_at = ?2 WHERE id = ?3",
                libsql::params![title.to_string(), now, id.to_string()],
            )
            .await?;
        Ok(affected > 0)
    }

    pub async fn update_issue_output_files(&self, id: &str, output_files: &str) -> Result<bool> {
        let now = chrono::Utc::now().to_rfc3339();
        let affected = self
            .conn()
            .execute(
                "UPDATE issues SET output_files = ?1, updated_at = ?2 WHERE id = ?3",
                libsql::params![output_files.to_string(), now, id.to_string()],
            )
            .await?;
        Ok(affected > 0)
    }
}
