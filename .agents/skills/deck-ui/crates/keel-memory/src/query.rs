use anyhow::{Context, Result};

use crate::store::MemoryStore;
use crate::types::{Memory, MemoryCategory, MemoryQuery};

impl MemoryStore {
    /// Search memories using the provided query parameters.
    /// When `search_text` is set, uses FTS5 MATCH for relevance ranking.
    pub async fn search(&self, query: MemoryQuery) -> Result<Vec<Memory>> {
        let mut sql = String::new();
        let mut conditions: Vec<String> = Vec::new();
        let mut values: Vec<libsql::Value> = Vec::new();
        let mut param_idx: usize = 1;
        let uses_fts = query.search_text.is_some();

        if uses_fts {
            sql.push_str(
                "SELECT m.id, m.project_id, m.content, m.category, m.source, \
                        m.tags, m.created_at, m.updated_at \
                 FROM memories m \
                 JOIN memories_fts fts ON m.rowid = fts.rowid",
            );
        } else {
            sql.push_str(
                "SELECT id, project_id, content, category, source, \
                        tags, created_at, updated_at \
                 FROM memories",
            );
        }

        if let Some(ref text) = query.search_text {
            conditions.push(format!("memories_fts MATCH ?{param_idx}"));
            values.push(libsql::Value::Text(text.clone()));
            param_idx += 1;
        }

        if let Some(ref project_id) = query.project_id {
            let col = if uses_fts { "m.project_id" } else { "project_id" };
            conditions.push(format!("{col} = ?{param_idx}"));
            values.push(libsql::Value::Text(project_id.clone()));
            param_idx += 1;
        }

        if let Some(ref category) = query.category {
            let col = if uses_fts { "m.category" } else { "category" };
            conditions.push(format!("{col} = ?{param_idx}"));
            values.push(libsql::Value::Text(category.to_string()));
            param_idx += 1;
        }

        for tag in &query.tags {
            let col = if uses_fts { "m.tags" } else { "tags" };
            conditions.push(format!(
                "EXISTS (SELECT 1 FROM json_each({col}) WHERE value = ?{param_idx})"
            ));
            values.push(libsql::Value::Text(tag.clone()));
            param_idx += 1;
        }

        if !conditions.is_empty() {
            sql.push_str(" WHERE ");
            sql.push_str(&conditions.join(" AND "));
        }

        if uses_fts {
            sql.push_str(" ORDER BY rank");
        } else {
            sql.push_str(" ORDER BY created_at DESC");
        }

        if let Some(limit) = query.limit {
            sql.push_str(&format!(" LIMIT ?{param_idx}"));
            values.push(libsql::Value::Integer(limit as i64));
            param_idx += 1;
        }

        if let Some(offset) = query.offset {
            sql.push_str(&format!(" OFFSET ?{param_idx}"));
            values.push(libsql::Value::Integer(offset as i64));
            let _ = param_idx; // suppress unused warning
        }

        let mut rows = self
            .conn()
            .query(&sql, libsql::params::Params::Positional(values))
            .await
            .context("Failed to search memories")?;

        let mut results = Vec::new();
        while let Some(row) = rows.next().await? {
            results.push(row_to_memory(&row)?);
        }
        Ok(results)
    }

    /// List all memories for a project, ordered by most recent first.
    pub async fn list_by_project(
        &self,
        project_id: &str,
    ) -> Result<Vec<Memory>> {
        self.search(MemoryQuery {
            project_id: Some(project_id.to_string()),
            ..Default::default()
        })
        .await
    }

    /// List memories for a project filtered by category.
    pub async fn list_by_category(
        &self,
        project_id: &str,
        category: MemoryCategory,
    ) -> Result<Vec<Memory>> {
        self.search(MemoryQuery {
            project_id: Some(project_id.to_string()),
            category: Some(category),
            ..Default::default()
        })
        .await
    }
}

/// Parse a database row into a Memory struct.
pub(crate) fn row_to_memory(row: &libsql::Row) -> Result<Memory> {
    let category_str: String = row.get::<String>(3)?;
    let category: MemoryCategory = category_str
        .parse()
        .context("Failed to parse memory category")?;

    let tags_json: String = row.get::<String>(5)?;
    let tags: Vec<String> = serde_json::from_str(&tags_json)
        .context("Failed to parse memory tags")?;

    let created_str: String = row.get::<String>(6)?;
    let updated_str: String = row.get::<String>(7)?;

    let created_at = chrono::DateTime::parse_from_rfc3339(&created_str)
        .context("Failed to parse created_at")?
        .with_timezone(&chrono::Utc);
    let updated_at = chrono::DateTime::parse_from_rfc3339(&updated_str)
        .context("Failed to parse updated_at")?
        .with_timezone(&chrono::Utc);

    Ok(Memory {
        id: row.get::<String>(0)?,
        project_id: row.get::<String>(1)?,
        content: row.get::<String>(2)?,
        category,
        source: row.get::<String>(4)?,
        tags,
        created_at,
        updated_at,
    })
}
