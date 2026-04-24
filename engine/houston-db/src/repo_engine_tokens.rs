//! CRUD for `engine_tokens`. Device-scoped bearer tokens minted during
//! pairing.
//!
//! Plaintext tokens NEVER hit disk. Callers hash with SHA-256 and pass the
//! hex digest. `verify_token` does the same on the inbound request path —
//! constant-time comparison happens in the caller (auth middleware).

use crate::db::Database;
use anyhow::Result;

/// One row from `engine_tokens`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EngineTokenRow {
    pub token_hash: String,
    pub device_label: String,
    pub created_at: String,
    pub revoked_at: Option<String>,
    pub last_seen_at: Option<String>,
}

impl Database {
    /// Mint a new token. Caller pre-hashes with SHA-256 (hex). Duplicate
    /// hash is an error (pairing should always generate fresh entropy).
    pub async fn insert_engine_token(
        &self,
        token_hash: &str,
        device_label: &str,
    ) -> Result<()> {
        let now = chrono::Utc::now().to_rfc3339();
        self.conn()
            .execute(
                "INSERT INTO engine_tokens (token_hash, device_label, created_at)
                 VALUES (?1, ?2, ?3)",
                libsql::params![
                    token_hash.to_string(),
                    device_label.to_string(),
                    now,
                ],
            )
            .await?;
        Ok(())
    }

    /// Check whether a hashed token is live (exists + not revoked).
    /// Updates `last_seen_at` on a hit. Returns the device label for logs.
    pub async fn touch_engine_token(&self, token_hash: &str) -> Result<Option<String>> {
        let mut rows = self
            .conn()
            .query(
                "SELECT device_label FROM engine_tokens
                 WHERE token_hash = ?1 AND revoked_at IS NULL",
                libsql::params![token_hash.to_string()],
            )
            .await?;

        let Some(row) = rows.next().await? else {
            return Ok(None);
        };
        let device_label: String = row.get(0)?;

        let now = chrono::Utc::now().to_rfc3339();
        self.conn()
            .execute(
                "UPDATE engine_tokens SET last_seen_at = ?1 WHERE token_hash = ?2",
                libsql::params![now, token_hash.to_string()],
            )
            .await?;
        Ok(Some(device_label))
    }

    /// Revoke a token. Idempotent — revoking an already-revoked token is
    /// a no-op. Returns whether a live row was actually revoked.
    pub async fn revoke_engine_token(&self, token_hash: &str) -> Result<bool> {
        let now = chrono::Utc::now().to_rfc3339();
        let affected = self
            .conn()
            .execute(
                "UPDATE engine_tokens SET revoked_at = ?1
                 WHERE token_hash = ?2 AND revoked_at IS NULL",
                libsql::params![now, token_hash.to_string()],
            )
            .await?;
        Ok(affected > 0)
    }

    /// List every non-revoked token for the Paired Devices UI.
    pub async fn list_active_engine_tokens(&self) -> Result<Vec<EngineTokenRow>> {
        let mut rows = self
            .conn()
            .query(
                "SELECT token_hash, device_label, created_at, revoked_at, last_seen_at
                 FROM engine_tokens
                 WHERE revoked_at IS NULL
                 ORDER BY created_at DESC",
                libsql::params![],
            )
            .await?;

        let mut out = Vec::new();
        while let Some(row) = rows.next().await? {
            out.push(EngineTokenRow {
                token_hash: row.get(0)?,
                device_label: row.get(1)?,
                created_at: row.get(2)?,
                revoked_at: row.get(3)?,
                last_seen_at: row.get(4)?,
            });
        }
        Ok(out)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn insert_and_touch_roundtrip() {
        let db = Database::connect_in_memory().await.unwrap();
        db.insert_engine_token("hash-a", "Julian's iPhone")
            .await
            .unwrap();

        let label = db.touch_engine_token("hash-a").await.unwrap();
        assert_eq!(label.as_deref(), Some("Julian's iPhone"));

        // Unknown hash → None.
        assert!(db.touch_engine_token("nope").await.unwrap().is_none());
    }

    #[tokio::test]
    async fn revoke_makes_touch_fail() {
        let db = Database::connect_in_memory().await.unwrap();
        db.insert_engine_token("hash-b", "old phone").await.unwrap();

        assert!(db.touch_engine_token("hash-b").await.unwrap().is_some());
        assert!(db.revoke_engine_token("hash-b").await.unwrap());
        assert!(db.touch_engine_token("hash-b").await.unwrap().is_none());

        // Revoke again — idempotent, returns false.
        assert!(!db.revoke_engine_token("hash-b").await.unwrap());
    }

    #[tokio::test]
    async fn list_active_excludes_revoked() {
        let db = Database::connect_in_memory().await.unwrap();
        db.insert_engine_token("hash-c", "phone-1").await.unwrap();
        db.insert_engine_token("hash-d", "phone-2").await.unwrap();
        db.revoke_engine_token("hash-c").await.unwrap();

        let rows = db.list_active_engine_tokens().await.unwrap();
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0].device_label, "phone-2");
    }
}
