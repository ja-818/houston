//! In-memory pairing code store + `PairingService` impl.
//!
//! Codes are minted via `POST /v1/tunnel/pairing`, live up to `CODE_TTL`,
//! and redeem exactly once-per-code FROM THE USER's POINT OF VIEW. On
//! the wire, redemption is *idempotent*: once a token has been minted
//! for a code, subsequent redeems of the same code return the SAME
//! token. This lets mobile safely retry across transient network /
//! tunnel blips without burning the code and forcing the user to mint
//! a fresh QR.
//!
//! The idempotency is bounded by `CODE_TTL` — after expiry, the mint
//! disappears and any future redeem returns `UnknownCode`.

use async_trait::async_trait;
use houston_db::Database;
use houston_tunnel::{PairError, PairOutcome, PairingService};
use rand::{distributions::Alphanumeric, Rng};
use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{Duration, Instant};

use crate::auth::hash_hex;

const CODE_TTL: Duration = Duration::from_secs(15 * 60);

/// A minted code, plus (once redeemed) the token that was handed out.
/// Keeping the plaintext `minted_token` in memory for up to `CODE_TTL`
/// enables idempotent retries; after expiry it's dropped with the
/// whole entry.
struct PendingCode {
    created: Instant,
    minted_token: Option<String>,
    device_label: Option<String>,
}

#[derive(Clone)]
pub struct PairStore {
    inner: std::sync::Arc<Inner>,
}

struct Inner {
    db: Database,
    codes: Mutex<HashMap<String, PendingCode>>,
}

impl PairStore {
    pub fn new(db: Database) -> Self {
        Self {
            inner: std::sync::Arc::new(Inner {
                db,
                codes: Mutex::new(HashMap::new()),
            }),
        }
    }

    /// Mint a fresh 6-digit code; caller prefixes with tunnelId when building
    /// the QR. Returns just the user-facing code.
    pub fn mint_code(&self) -> String {
        let n: u32 = rand::thread_rng().gen_range(100_000..1_000_000);
        let code = format!("{n:06}");
        self.gc();
        self.inner.codes.lock().unwrap().insert(
            code.clone(),
            PendingCode {
                created: Instant::now(),
                minted_token: None,
                device_label: None,
            },
        );
        code
    }

    fn gc(&self) {
        let mut g = self.inner.codes.lock().unwrap();
        g.retain(|_, p| p.created.elapsed() < CODE_TTL);
    }
}

#[async_trait]
impl PairingService for PairStore {
    async fn redeem(&self, code: &str, device_label: &str) -> Result<PairOutcome, PairError> {
        // Lookup under lock. Three cases:
        //   1. No entry (or expired) → UnknownCode.
        //   2. Entry exists + already minted → return the same token
        //      (idempotent retry).
        //   3. Entry exists + not yet minted → reserve the slot by
        //      stashing a fresh token, then do DB insert outside the
        //      lock. If DB insert fails, clear the stash so future
        //      retries get another clean attempt.
        let token_to_insert = {
            let mut g = self.inner.codes.lock().unwrap();
            let Some(p) = g.get_mut(code) else {
                return Err(PairError::UnknownCode);
            };
            if p.created.elapsed() >= CODE_TTL {
                g.remove(code);
                return Err(PairError::UnknownCode);
            }
            if let Some(ref existing) = p.minted_token {
                // Idempotent retry. Different device_label still gets the
                // same token — the code IS the secret, and we'd rather
                // let a honest retry succeed than prompt a confused user
                // to re-scan.
                return Ok(PairOutcome {
                    engine_token: existing.clone(),
                });
            }
            let token: String = rand::thread_rng()
                .sample_iter(&Alphanumeric)
                .take(48)
                .map(char::from)
                .collect();
            p.minted_token = Some(token.clone());
            p.device_label = Some(device_label.to_string());
            token
        };

        let hash = hash_hex(&token_to_insert);
        match self.inner.db.insert_engine_token(&hash, device_label).await {
            Ok(()) => Ok(PairOutcome {
                engine_token: token_to_insert,
            }),
            Err(e) => {
                // Clear the stash so a future retry can try again
                // cleanly. Without this, the user is stuck with a token
                // that isn't in the DB — every subsequent request 401s.
                if let Some(p) = self.inner.codes.lock().unwrap().get_mut(code) {
                    p.minted_token = None;
                    p.device_label = None;
                }
                Err(PairError::Internal(e.to_string()))
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn happy_path_mint_and_redeem() {
        let db = Database::connect_in_memory().await.unwrap();
        let store = PairStore::new(db);
        let code = store.mint_code();
        let out = store.redeem(&code, "iPhone").await.unwrap();
        assert_eq!(out.engine_token.len(), 48);
    }

    #[tokio::test]
    async fn double_redeem_returns_same_token() {
        // Idempotency: mobile retry on transient errors must not burn
        // the code. Both redeems of the same code return the same token.
        let db = Database::connect_in_memory().await.unwrap();
        let store = PairStore::new(db);
        let code = store.mint_code();
        let first = store.redeem(&code, "iPhone").await.unwrap();
        let second = store.redeem(&code, "iPhone").await.unwrap();
        assert_eq!(first.engine_token, second.engine_token);
    }

    #[tokio::test]
    async fn expired_code_redeem_fails() {
        // Sanity: we still reject once the entry is absent. (We can't
        // time-travel here without plumbing a clock, so just assert the
        // unknown-code path.)
        let db = Database::connect_in_memory().await.unwrap();
        let store = PairStore::new(db);
        matches!(
            store.redeem("999999", "iPhone").await.unwrap_err(),
            PairError::UnknownCode
        );
    }

    #[tokio::test]
    async fn unknown_code_fails() {
        let db = Database::connect_in_memory().await.unwrap();
        let store = PairStore::new(db);
        matches!(
            store.redeem("000000", "iPhone").await.unwrap_err(),
            PairError::UnknownCode
        );
    }
}
