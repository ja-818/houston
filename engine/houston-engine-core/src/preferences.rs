//! Preferences — key/value store backed by SQLite.
//!
//! Transport-neutral: HTTP routes and Tauri proxies call these functions.
//! Relocated from `app/src-tauri/src/commands/preferences.rs`.

use crate::error::{CoreError, CoreResult};
use houston_db::Database;

/// Preference key for the user's IANA timezone (e.g. `"America/Bogota"`).
/// Cron schedules without a per-routine override are interpreted in this zone.
pub const TIMEZONE_KEY: &str = "timezone";

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

/// Resolve the user's effective timezone. Returns `"UTC"` if unset.
pub async fn timezone(db: &Database) -> String {
    get(db, TIMEZONE_KEY)
        .await
        .ok()
        .flatten()
        .filter(|s| !s.trim().is_empty())
        .unwrap_or_else(|| "UTC".to_string())
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
