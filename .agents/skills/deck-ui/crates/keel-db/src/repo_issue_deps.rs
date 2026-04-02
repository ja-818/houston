use crate::db::Database;
use anyhow::{Context, Result};
use std::collections::HashMap;

impl Database {
    /// Declare that `issue_id` is blocked by `depends_on_id` (must be Done first).
    pub async fn add_issue_dependency(
        &self,
        issue_id: &str,
        depends_on_id: &str,
    ) -> Result<()> {
        self.conn()
            .execute(
                "INSERT OR IGNORE INTO issue_dependencies (issue_id, depends_on_id)
                 VALUES (?1, ?2)",
                libsql::params![issue_id.to_string(), depends_on_id.to_string()],
            )
            .await
            .context("Failed to add issue dependency")?;
        Ok(())
    }

    /// Remove a dependency relationship between two issues.
    pub async fn remove_issue_dependency(
        &self,
        issue_id: &str,
        depends_on_id: &str,
    ) -> Result<()> {
        self.conn()
            .execute(
                "DELETE FROM issue_dependencies WHERE issue_id = ?1 AND depends_on_id = ?2",
                libsql::params![issue_id.to_string(), depends_on_id.to_string()],
            )
            .await
            .context("Failed to remove issue dependency")?;
        Ok(())
    }

    /// Return the IDs of all issues that `issue_id` depends on (is blocked by).
    pub async fn list_issue_dependencies(&self, issue_id: &str) -> Result<Vec<String>> {
        let mut rows = self
            .conn()
            .query(
                "SELECT depends_on_id FROM issue_dependencies WHERE issue_id = ?1",
                [issue_id],
            )
            .await
            .context("Failed to list issue dependencies")?;
        let mut deps = Vec::new();
        while let Some(row) = rows.next().await? {
            deps.push(row.get::<String>(0)?);
        }
        Ok(deps)
    }

    /// Load all dependency relationships for every issue in a project in one query.
    /// Returns a map of `issue_id -> Vec<depends_on_id>`.
    pub async fn load_deps_for_project(
        &self,
        project_id: &str,
    ) -> Result<HashMap<String, Vec<String>>> {
        let mut rows = self
            .conn()
            .query(
                "SELECT d.issue_id, d.depends_on_id
                 FROM issue_dependencies d
                 JOIN issues i ON i.id = d.issue_id
                 WHERE i.project_id = ?1",
                [project_id],
            )
            .await
            .context("Failed to load project dependencies")?;
        let mut map: HashMap<String, Vec<String>> = HashMap::new();
        while let Some(row) = rows.next().await? {
            let issue_id: String = row.get(0)?;
            let dep_id: String = row.get(1)?;
            map.entry(issue_id).or_default().push(dep_id);
        }
        Ok(map)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn add_and_list_dependency() {
        let db = Database::connect_in_memory().await.unwrap();
        let p = db.create_project("P", "/tmp/p").await.unwrap();
        let a = db.create_issue(&p.id, "A", "", None).await.unwrap();
        let b = db.create_issue(&p.id, "B", "", None).await.unwrap();

        db.add_issue_dependency(&b.id, &a.id).await.unwrap();

        let deps = db.list_issue_dependencies(&b.id).await.unwrap();
        assert_eq!(deps, vec![a.id.clone()]);

        // a has no dependencies.
        let a_deps = db.list_issue_dependencies(&a.id).await.unwrap();
        assert!(a_deps.is_empty());
    }

    #[tokio::test]
    async fn remove_dependency() {
        let db = Database::connect_in_memory().await.unwrap();
        let p = db.create_project("P", "/tmp/p").await.unwrap();
        let a = db.create_issue(&p.id, "A", "", None).await.unwrap();
        let b = db.create_issue(&p.id, "B", "", None).await.unwrap();

        db.add_issue_dependency(&b.id, &a.id).await.unwrap();
        db.remove_issue_dependency(&b.id, &a.id).await.unwrap();

        let deps = db.list_issue_dependencies(&b.id).await.unwrap();
        assert!(deps.is_empty());
    }

    #[tokio::test]
    async fn duplicate_dependency_is_ignored() {
        let db = Database::connect_in_memory().await.unwrap();
        let p = db.create_project("P", "/tmp/p").await.unwrap();
        let a = db.create_issue(&p.id, "A", "", None).await.unwrap();
        let b = db.create_issue(&p.id, "B", "", None).await.unwrap();

        db.add_issue_dependency(&b.id, &a.id).await.unwrap();
        db.add_issue_dependency(&b.id, &a.id).await.unwrap(); // should not error

        let deps = db.list_issue_dependencies(&b.id).await.unwrap();
        assert_eq!(deps.len(), 1);
    }

    #[tokio::test]
    async fn load_deps_for_project_batch() {
        let db = Database::connect_in_memory().await.unwrap();
        let p = db.create_project("P", "/tmp/p").await.unwrap();
        let a = db.create_issue(&p.id, "A", "", None).await.unwrap();
        let b = db.create_issue(&p.id, "B", "", None).await.unwrap();
        let c = db.create_issue(&p.id, "C", "", None).await.unwrap();

        // B depends on A; C depends on A and B.
        db.add_issue_dependency(&b.id, &a.id).await.unwrap();
        db.add_issue_dependency(&c.id, &a.id).await.unwrap();
        db.add_issue_dependency(&c.id, &b.id).await.unwrap();

        let map = db.load_deps_for_project(&p.id).await.unwrap();

        assert_eq!(
            map.get(&b.id).cloned().unwrap_or_default(),
            vec![a.id.clone()]
        );

        let mut c_deps = map.get(&c.id).cloned().unwrap_or_default();
        c_deps.sort();
        let mut expected = vec![a.id.clone(), b.id.clone()];
        expected.sort();
        assert_eq!(c_deps, expected);

        // A has no dependencies.
        assert!(map.get(&a.id).is_none());
    }

    #[tokio::test]
    async fn dependency_cascades_when_blocking_issue_deleted() {
        let db = Database::connect_in_memory().await.unwrap();
        let p = db.create_project("P", "/tmp/p").await.unwrap();
        let a = db.create_issue(&p.id, "A", "", None).await.unwrap();
        let b = db.create_issue(&p.id, "B", "", None).await.unwrap();

        db.add_issue_dependency(&b.id, &a.id).await.unwrap();
        db.delete_issue(&a.id).await.unwrap();

        // After deleting the blocker, B should have no dependencies.
        let deps = db.list_issue_dependencies(&b.id).await.unwrap();
        assert!(deps.is_empty(), "dependency should cascade-delete with blocker");
    }

    #[tokio::test]
    async fn dependency_cascades_when_blocked_issue_deleted() {
        let db = Database::connect_in_memory().await.unwrap();
        let p = db.create_project("P", "/tmp/p").await.unwrap();
        let a = db.create_issue(&p.id, "A", "", None).await.unwrap();
        let b = db.create_issue(&p.id, "B", "", None).await.unwrap();

        db.add_issue_dependency(&b.id, &a.id).await.unwrap();
        db.delete_issue(&b.id).await.unwrap();

        // After deleting the dependent, the map for the project should be empty.
        let map = db.load_deps_for_project(&p.id).await.unwrap();
        assert!(map.is_empty());
    }
}
