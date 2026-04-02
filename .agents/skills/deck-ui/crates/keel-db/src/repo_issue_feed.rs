use crate::db::Database;
use anyhow::Result;

impl Database {
    /// Persist a single issue feed item.
    pub async fn add_issue_feed_item(
        &self,
        issue_id: &str,
        feed_type: &str,
        data_json: &str,
    ) -> Result<()> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn()
            .execute(
                "INSERT INTO issue_feed_items (issue_id, feed_type, data_json, timestamp)
                 VALUES (?1, ?2, ?3, ?4)",
                libsql::params![issue_id, feed_type, data_json, now],
            )
            .await?;
        Ok(())
    }

    /// Load all feed items for an issue (chronological order).
    pub async fn list_issue_feed_items(&self, issue_id: &str) -> Result<Vec<IssueFeedRow>> {
        let mut rows = self
            .conn()
            .query(
                "SELECT feed_type, data_json FROM issue_feed_items
                 WHERE issue_id = ?1 ORDER BY id ASC",
                [issue_id],
            )
            .await?;
        let mut items = Vec::new();
        while let Some(row) = rows.next().await? {
            items.push(IssueFeedRow {
                feed_type: row.get::<String>(0)?,
                data_json: row.get::<String>(1)?,
            });
        }
        Ok(items)
    }

    /// Delete all feed items for an issue (used on issue delete cascade).
    pub async fn delete_issue_feed_items(&self, issue_id: &str) -> Result<()> {
        self.conn()
            .execute(
                "DELETE FROM issue_feed_items WHERE issue_id = ?1",
                [issue_id],
            )
            .await?;
        Ok(())
    }
}

pub struct IssueFeedRow {
    pub feed_type: String,
    pub data_json: String,
}
