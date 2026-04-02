use crate::db::Database;
use crate::models::SessionEvent;
use anyhow::Result;

impl Database {
    pub async fn add_session_event(
        &self,
        session_id: &str,
        event_type: &str,
        content: &str,
    ) -> Result<()> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn()
            .execute(
                "INSERT INTO session_events (session_id, event_type, content, timestamp)
             VALUES (?1, ?2, ?3, ?4)",
                libsql::params![session_id, event_type, content, now],
            )
            .await?;
        Ok(())
    }

    pub async fn add_event_for_job(
        &self,
        job_id: &str,
        event_type: &str,
        content: &str,
    ) -> Result<()> {
        if let Some(session) = self.get_session_for_job(job_id).await? {
            self.add_session_event(&session.id, event_type, content)
                .await?;
        }
        Ok(())
    }

    pub async fn get_events_for_job(&self, job_id: &str) -> Result<Vec<SessionEvent>> {
        let mut rows = self
            .conn()
            .query(
                "SELECT e.id, e.session_id, e.event_type, e.content, e.timestamp
             FROM session_events e
             JOIN sessions s ON s.id = e.session_id
             WHERE s.job_id = ?1 ORDER BY e.id ASC",
                [job_id],
            )
            .await?;
        let mut events = Vec::new();
        while let Some(row) = rows.next().await? {
            events.push(Self::row_to_event(&row)?);
        }
        Ok(events)
    }

    /// Bulk-insert pre-resolved session events in a single transaction.
    /// `events` is a list of `(session_id, event_type, content)` tuples.
    pub async fn bulk_add_session_events(
        &self,
        events: Vec<(String, String, String)>,
    ) -> Result<()> {
        if events.is_empty() {
            return Ok(());
        }
        let now = chrono::Utc::now().to_rfc3339();
        self.conn().execute("BEGIN", libsql::params![]).await?;
        for (session_id, event_type, content) in &events {
            if let Err(e) = self
                .conn()
                .execute(
                    "INSERT INTO session_events (session_id, event_type, content, timestamp)
                 VALUES (?1, ?2, ?3, ?4)",
                    libsql::params![
                        session_id.clone(),
                        event_type.clone(),
                        content.clone(),
                        now.clone()
                    ],
                )
                .await
            {
                let _ = self.conn().execute("ROLLBACK", libsql::params![]).await;
                return Err(e.into());
            }
        }
        self.conn().execute("COMMIT", libsql::params![]).await?;
        Ok(())
    }

    /// Return up to `limit` events for a job starting at `offset` (chronological order).
    /// Used to page in older events trimmed from the in-memory feed buffer.
    pub async fn get_events_for_job_range(
        &self,
        job_id: &str,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<SessionEvent>> {
        let mut rows = self
            .conn()
            .query(
                "SELECT e.id, e.session_id, e.event_type, e.content, e.timestamp
             FROM session_events e
             JOIN sessions s ON s.id = e.session_id
             WHERE s.job_id = ?1 ORDER BY e.id ASC
             LIMIT ?2 OFFSET ?3",
                libsql::params![job_id, limit, offset],
            )
            .await?;
        let mut events = Vec::new();
        while let Some(row) = rows.next().await? {
            events.push(Self::row_to_event(&row)?);
        }
        Ok(events)
    }

    fn row_to_event(row: &libsql::Row) -> Result<SessionEvent> {
        Ok(SessionEvent {
            id: row.get::<i64>(0)?,
            session_id: row.get::<String>(1)?,
            event_type: row.get::<String>(2)?,
            content: row.get::<String>(3)?,
            timestamp: row.get::<String>(4)?,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    async fn setup_job_with_events(count: usize) -> (Database, String) {
        let db = Database::connect_in_memory().await.unwrap();
        let fake_job_id = "fake-job-1".to_string();
        db.create_session("ses-1", Some(&fake_job_id), "prompt")
            .await
            .unwrap();
        for i in 0..count {
            db.add_session_event("ses-1", "assistant_text", &format!("event {i}"))
                .await
                .unwrap();
        }
        (db, fake_job_id)
    }

    #[tokio::test]
    async fn get_events_for_job_range_returns_page() {
        let (db, job_id) = setup_job_with_events(10).await;

        let page = db.get_events_for_job_range(&job_id, 5, 0).await.unwrap();
        assert_eq!(page.len(), 5);
        assert!(page[0].content.contains("event 0"));
        assert!(page[4].content.contains("event 4"));
    }

    #[tokio::test]
    async fn get_events_for_job_range_offset_paging() {
        let (db, job_id) = setup_job_with_events(10).await;

        let page = db.get_events_for_job_range(&job_id, 5, 5).await.unwrap();
        assert_eq!(page.len(), 5);
        assert!(page[0].content.contains("event 5"));
        assert!(page[4].content.contains("event 9"));
    }

    #[tokio::test]
    async fn get_events_for_job_range_partial_last_page() {
        let (db, job_id) = setup_job_with_events(7).await;

        // Request last 100 starting from offset 5 — only 2 remain.
        let page = db
            .get_events_for_job_range(&job_id, 100, 5)
            .await
            .unwrap();
        assert_eq!(page.len(), 2);
    }
}
