//! Preferences — key/value store backed by SQLite.
//!
//! Transport-neutral: HTTP routes and Tauri proxies call these functions.
//! Relocated from `app/src-tauri/src/commands/preferences.rs`.

use crate::error::{CoreError, CoreResult};
use houston_db::Database;

/// Preference key for the user's IANA timezone (e.g. `"America/Bogota"`).
/// Cron schedules without a per-routine override are interpreted in this zone.
pub const TIMEZONE_KEY: &str = "timezone";

/// Preference key for the user's chosen UI locale (BCP-47 base tag such as
/// `"en"`, `"es"`, `"pt"`). Read at app boot by the desktop frontend to
/// pick the initial i18n language. The engine itself is locale-agnostic —
/// this value is surfaced verbatim to whichever frontend is consuming it.
pub const LOCALE_KEY: &str = "locale";

// NOTE: D₁ adds `legal_acceptance` preference key here — keep this section
// append-only and do not reorder the existing constants to minimise merge
// conflicts when their branch lands.

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

/// Resolve the user's effective UI locale. Returns `None` if unset — the
/// frontend then falls back to navigator/browser detection.
pub async fn locale(db: &Database) -> Option<String> {
    get(db, LOCALE_KEY)
        .await
        .ok()
        .flatten()
        .filter(|s| !s.trim().is_empty())
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

    #[tokio::test]
    async fn locale_unset_returns_none() {
        let db = mem_db().await;
        assert!(locale(&db).await.is_none());
    }

    #[tokio::test]
    async fn locale_roundtrip_and_blank_treated_as_unset() {
        let db = mem_db().await;
        set(&db, LOCALE_KEY, "es").await.unwrap();
        assert_eq!(locale(&db).await.as_deref(), Some("es"));
        // Whitespace-only values collapse to None, mirroring timezone().
        set(&db, LOCALE_KEY, "   ").await.unwrap();
        assert!(locale(&db).await.is_none());
    }
}
