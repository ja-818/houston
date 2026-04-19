//! Preferences — key/value store backed by SQLite.
//!
//! Transport-neutral: HTTP routes and Tauri proxies call these functions.
//! Relocated from `app/src-tauri/src/commands/preferences.rs`.

use crate::error::{CoreError, CoreResult};
use houston_db::Database;

pub async fn get(db: &Database, key: &str) -> CoreResult<Option<String>> {
    db.get_preference(key)
        .await
        .map_err(|e| CoreError::Internal(e.to_string()))
}

pub async fn set(db: &Database, key: &str, value: &str) -> CoreResult<()> {
    db.set_preference(key, value)
        .await
        .map_err(|e| CoreError::Internal(e.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    async fn mem_db() -> Database {
        Database::connect_in_memory().await.unwrap()
    }

    #[tokio::test]
    async fn get_missing_returns_none() {
        let db = mem_db().await;
        assert!(get(&db, "nope").await.unwrap().is_none());
    }

    #[tokio::test]
    async fn set_then_get_roundtrip() {
        let db = mem_db().await;
        set(&db, "theme", "dark").await.unwrap();
        assert_eq!(get(&db, "theme").await.unwrap().as_deref(), Some("dark"));
        set(&db, "theme", "light").await.unwrap();
        assert_eq!(get(&db, "theme").await.unwrap().as_deref(), Some("light"));
    }
}
