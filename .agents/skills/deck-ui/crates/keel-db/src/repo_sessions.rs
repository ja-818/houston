use crate::db::Database;
use crate::models::Session;
use anyhow::{Context, Result};

impl Database {
    pub async fn create_session(
        &self,
        id: &str,
        job_id: Option<&str>,
        prompt: &str,
    ) -> Result<Session> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn()
            .execute(
                "INSERT INTO sessions (id, job_id, status, prompt, created_at)
             VALUES (?1, ?2, 'running', ?3, ?4)",
                libsql::params![
                    id.to_string(),
                    job_id.map(|s| s.to_string()),
                    prompt.to_string(),
                    now.clone()
                ],
            )
            .await
            .context("Failed to create session")?;

        Ok(Session {
            id: id.to_string(),
            job_id: job_id.map(String::from),
            claude_session_id: None,
            status: "running".to_string(),
            prompt: prompt.to_string(),
            created_at: now,
            completed_at: None,
        })
    }

    pub async fn get_session_for_job(&self, job_id: &str) -> Result<Option<Session>> {
        let mut rows = self
            .conn()
            .query(
                "SELECT id, job_id, claude_session_id, status, prompt, created_at, completed_at
             FROM sessions WHERE job_id = ?1 ORDER BY created_at DESC LIMIT 1",
                [job_id],
            )
            .await?;
        match rows.next().await? {
            Some(row) => Ok(Some(Self::row_to_session(&row)?)),
            None => Ok(None),
        }
    }

    pub async fn update_session_claude_id_by_job(
        &self,
        job_id: &str,
        claude_session_id: &str,
    ) -> Result<()> {
        self.conn()
            .execute(
                "UPDATE sessions SET claude_session_id = ?1
             WHERE id = (SELECT id FROM sessions WHERE job_id = ?2
                         ORDER BY created_at DESC LIMIT 1)",
                libsql::params![claude_session_id.to_string(), job_id.to_string()],
            )
            .await?;
        Ok(())
    }

    pub async fn complete_session_by_job(&self, job_id: &str) -> Result<()> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn()
            .execute(
                "UPDATE sessions SET status = 'completed', completed_at = ?1
             WHERE id = (SELECT id FROM sessions WHERE job_id = ?2
                         ORDER BY created_at DESC LIMIT 1)",
                libsql::params![now, job_id.to_string()],
            )
            .await?;
        Ok(())
    }

    pub(crate) fn row_to_session(row: &libsql::Row) -> Result<Session> {
        Ok(Session {
            id: row.get::<String>(0)?,
            job_id: row.get::<Option<String>>(1)?,
            claude_session_id: row.get::<Option<String>>(2)?,
            status: row.get::<String>(3)?,
            prompt: row.get::<String>(4)?,
            created_at: row.get::<String>(5)?,
            completed_at: row.get::<Option<String>>(6)?,
        })
    }
}
