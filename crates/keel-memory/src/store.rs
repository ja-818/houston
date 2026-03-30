use std::path::PathBuf;
use std::sync::Arc;

use anyhow::{Context, Result};
use libsql::Connection;

use crate::markdown;
use crate::migrations;
use crate::query::row_to_memory;
use crate::types::{Memory, MemoryCategory};

/// Persistent memory store backed by SQLite (libsql) with optional markdown mirroring.
pub struct MemoryStore {
    conn: Arc<Connection>,
    memory_dir: Option<PathBuf>,
}

impl MemoryStore {
    /// Create a new store without markdown mirroring.
    pub async fn new(conn: Arc<Connection>) -> Result<Self> {
        let store = Self {
            conn,
            memory_dir: None,
        };
        store.init().await?;
        Ok(store)
    }

    /// Create a new store that also mirrors memories as markdown files.
    pub async fn new_with_markdown_dir(
        conn: Arc<Connection>,
        dir: PathBuf,
    ) -> Result<Self> {
        let store = Self {
            conn,
            memory_dir: Some(dir),
        };
        store.init().await?;
        Ok(store)
    }

    /// Initialize database tables, indexes, FTS, and triggers.
    pub async fn init(&self) -> Result<()> {
        migrations::run_migrations(&self.conn).await
    }

    /// Access the underlying database connection.
    pub(crate) fn conn(&self) -> &Connection {
        &self.conn
    }

    // ── CRUD ────────────────────────────────────────────────

    /// Create a new memory and return it.
    pub async fn create(
        &self,
        project_id: &str,
        content: &str,
        category: MemoryCategory,
        source: &str,
        tags: Vec<String>,
    ) -> Result<Memory> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now();
        let now_str = now.to_rfc3339();
        let tags_json =
            serde_json::to_string(&tags).context("Failed to serialize tags")?;

        self.conn
            .execute(
                "INSERT INTO memories \
                    (id, project_id, content, category, source, tags, created_at, updated_at) \
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                libsql::params![
                    id.clone(),
                    project_id.to_string(),
                    content.to_string(),
                    category.to_string(),
                    source.to_string(),
                    tags_json.clone(),
                    now_str.clone(),
                    now_str.clone()
                ],
            )
            .await
            .context("Failed to insert memory")?;

        let memory = Memory {
            id,
            project_id: project_id.to_string(),
            content: content.to_string(),
            category,
            source: source.to_string(),
            tags,
            created_at: now,
            updated_at: now,
        };

        self.sync_to_markdown(&memory).await?;
        Ok(memory)
    }

    /// Retrieve a single memory by id.
    pub async fn get(&self, id: &str) -> Result<Option<Memory>> {
        let mut rows = self
            .conn
            .query(
                "SELECT id, project_id, content, category, source, tags, \
                        created_at, updated_at \
                 FROM memories WHERE id = ?1",
                [id],
            )
            .await
            .context("Failed to query memory")?;

        match rows.next().await? {
            Some(row) => Ok(Some(row_to_memory(&row)?)),
            None => Ok(None),
        }
    }

    /// Update the content and tags of an existing memory.
    pub async fn update(
        &self,
        id: &str,
        content: &str,
        tags: Vec<String>,
    ) -> Result<()> {
        let now_str = chrono::Utc::now().to_rfc3339();
        let tags_json =
            serde_json::to_string(&tags).context("Failed to serialize tags")?;

        let affected = self
            .conn
            .execute(
                "UPDATE memories \
                 SET content = ?1, tags = ?2, updated_at = ?3 \
                 WHERE id = ?4",
                libsql::params![
                    content.to_string(),
                    tags_json,
                    now_str,
                    id.to_string()
                ],
            )
            .await
            .context("Failed to update memory")?;

        if affected == 0 {
            return Err(anyhow::anyhow!("memory not found: {}", id));
        }

        // Re-fetch to sync markdown with the latest state.
        if let Some(memory) = self.get(id).await? {
            self.sync_to_markdown(&memory).await?;
        }

        Ok(())
    }

    /// Delete a memory by id.
    pub async fn delete(&self, id: &str) -> Result<()> {
        // Fetch before deleting so we can remove the markdown file.
        let memory = self.get(id).await?;

        let affected = self
            .conn
            .execute(
                "DELETE FROM memories WHERE id = ?1",
                libsql::params![id.to_string()],
            )
            .await
            .context("Failed to delete memory")?;

        if affected == 0 {
            return Err(anyhow::anyhow!("memory not found: {}", id));
        }

        if let Some(mem) = memory {
            self.delete_markdown(&mem).await?;
        }

        Ok(())
    }

    async fn sync_to_markdown(&self, memory: &Memory) -> Result<()> {
        if let Some(ref dir) = self.memory_dir {
            markdown::write_memory_file(dir, memory).await?;
        }
        Ok(())
    }

    async fn delete_markdown(&self, memory: &Memory) -> Result<()> {
        if let Some(ref dir) = self.memory_dir {
            markdown::delete_memory_file(dir, memory).await?;
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::MemoryQuery;

    async fn test_store() -> MemoryStore {
        let db = libsql::Builder::new_local(":memory:")
            .build()
            .await
            .expect("Failed to open in-memory db");
        let conn = Arc::new(db.connect().expect("Failed to connect"));
        MemoryStore::new(conn).await.expect("Failed to init store")
    }

    #[tokio::test]
    async fn create_and_get_memory() {
        let store = test_store().await;
        let mem = store
            .create(
                "proj-1",
                "User prefers dark mode",
                MemoryCategory::Preference,
                "agent",
                vec!["ui".into()],
            )
            .await
            .expect("create failed");

        assert_eq!(mem.project_id, "proj-1");
        assert_eq!(mem.content, "User prefers dark mode");
        assert_eq!(mem.category, MemoryCategory::Preference);
        assert_eq!(mem.source, "agent");
        assert_eq!(mem.tags, vec!["ui".to_string()]);

        let fetched = store
            .get(&mem.id)
            .await
            .expect("get failed")
            .expect("not found");
        assert_eq!(fetched.id, mem.id);
        assert_eq!(fetched.content, mem.content);
    }

    #[tokio::test]
    async fn update_memory() {
        let store = test_store().await;
        let mem = store
            .create("proj-1", "original", MemoryCategory::Fact, "user", vec![])
            .await
            .expect("create failed");

        store
            .update(&mem.id, "updated content", vec!["new-tag".into()])
            .await
            .expect("update failed");

        let fetched = store
            .get(&mem.id)
            .await
            .expect("get failed")
            .expect("not found");
        assert_eq!(fetched.content, "updated content");
        assert_eq!(fetched.tags, vec!["new-tag".to_string()]);
    }

    #[tokio::test]
    async fn delete_memory() {
        let store = test_store().await;
        let mem = store
            .create("proj-1", "to delete", MemoryCategory::Fact, "agent", vec![])
            .await
            .expect("create failed");

        store.delete(&mem.id).await.expect("delete failed");

        let fetched = store.get(&mem.id).await.expect("get failed");
        assert!(fetched.is_none());
    }

    #[tokio::test]
    async fn delete_nonexistent_memory_errors() {
        let store = test_store().await;
        let result = store.delete("nonexistent-id").await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn list_by_project() {
        let store = test_store().await;
        store
            .create("proj-1", "mem a", MemoryCategory::Fact, "agent", vec![])
            .await
            .expect("create a");
        store
            .create("proj-1", "mem b", MemoryCategory::Skill, "agent", vec![])
            .await
            .expect("create b");
        store
            .create("proj-2", "mem c", MemoryCategory::Fact, "agent", vec![])
            .await
            .expect("create c");

        let proj1 = store.list_by_project("proj-1").await.expect("list failed");
        assert_eq!(proj1.len(), 2);

        let proj2 = store.list_by_project("proj-2").await.expect("list failed");
        assert_eq!(proj2.len(), 1);
    }

    #[tokio::test]
    async fn list_by_category() {
        let store = test_store().await;
        store
            .create("proj-1", "fact 1", MemoryCategory::Fact, "agent", vec![])
            .await
            .expect("create");
        store
            .create("proj-1", "skill 1", MemoryCategory::Skill, "agent", vec![])
            .await
            .expect("create");

        let facts = store
            .list_by_category("proj-1", MemoryCategory::Fact)
            .await
            .expect("list failed");
        assert_eq!(facts.len(), 1);
        assert_eq!(facts[0].category, MemoryCategory::Fact);
    }

    #[tokio::test]
    async fn search_with_fts() {
        let store = test_store().await;
        store
            .create(
                "proj-1",
                "Rust async patterns",
                MemoryCategory::Skill,
                "agent",
                vec!["rust".into()],
            )
            .await
            .expect("create");
        store
            .create(
                "proj-1",
                "Python decorators",
                MemoryCategory::Skill,
                "agent",
                vec!["python".into()],
            )
            .await
            .expect("create");

        let results = store
            .search(MemoryQuery {
                project_id: Some("proj-1".into()),
                search_text: Some("Rust".into()),
                ..Default::default()
            })
            .await
            .expect("search failed");

        assert_eq!(results.len(), 1);
        assert!(results[0].content.contains("Rust"));
    }

    #[tokio::test]
    async fn search_with_tags() {
        let store = test_store().await;
        store
            .create(
                "proj-1",
                "tagged",
                MemoryCategory::Fact,
                "agent",
                vec!["important".into(), "work".into()],
            )
            .await
            .expect("create");
        store
            .create("proj-1", "untagged", MemoryCategory::Fact, "agent", vec![])
            .await
            .expect("create");

        let results = store
            .search(MemoryQuery {
                project_id: Some("proj-1".into()),
                tags: vec!["important".into()],
                ..Default::default()
            })
            .await
            .expect("search failed");

        assert_eq!(results.len(), 1);
        assert_eq!(results[0].content, "tagged");
    }

    #[tokio::test]
    async fn search_with_limit_and_offset() {
        let store = test_store().await;
        for i in 0..5 {
            store
                .create(
                    "proj-1",
                    &format!("mem {i}"),
                    MemoryCategory::Fact,
                    "agent",
                    vec![],
                )
                .await
                .expect("create");
        }

        let results = store
            .search(MemoryQuery {
                project_id: Some("proj-1".into()),
                limit: Some(2),
                offset: Some(1),
                ..Default::default()
            })
            .await
            .expect("search failed");

        assert_eq!(results.len(), 2);
    }
}
