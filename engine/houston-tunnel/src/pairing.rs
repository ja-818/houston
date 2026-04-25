//! Pairing code ↔ device-token exchange.
//!
//! The engine mints 6-digit pairing codes in `routes/tunnel.rs::POST
//! /v1/tunnel/pairing`. They live in-memory for a short TTL (5 min).
//! When mobile POSTs `/pair/<tunnelId>-<code>` to the relay, the relay
//! forwards a [`PairRequestFrame`] over the tunnel; the engine's
//! [`PairingService`] is responsible for:
//!
//! 1. verifying the code is still live + unconsumed
//! 2. minting a fresh bearer token
//! 3. hashing + inserting into `engine_tokens` via the DB
//! 4. returning the plaintext token in the [`PairResponseFrame`]
//!
//! `PairingService` is a trait so we can swap the implementation in
//! tests (no real DB, no real RNG).

use async_trait::async_trait;

#[derive(Debug, Clone)]
pub struct PairOutcome {
    pub engine_token: String,
}

#[derive(Debug, thiserror::Error)]
pub enum PairError {
    #[error("unknown or expired code")]
    UnknownCode,
    #[error("already consumed")]
    AlreadyConsumed,
    #[error("internal: {0}")]
    Internal(String),
}

impl PairError {
    /// Stable wire code. Must stay in sync with
    /// `houston-relay/src/types.ts::PairErrorCode` and mobile's
    /// `friendlyError` mapping.
    pub fn code(&self) -> &'static str {
        match self {
            PairError::UnknownCode => "code_unknown",
            PairError::AlreadyConsumed => "code_consumed",
            PairError::Internal(_) => "internal",
        }
    }
}

#[async_trait]
pub trait PairingService: Send + Sync + 'static {
    /// Redeem a pairing code. Idempotent-within-the-error: repeated calls
    /// with the same code after success return `AlreadyConsumed`.
    async fn redeem(&self, code: &str, device_label: &str) -> Result<PairOutcome, PairError>;
}

#[cfg(test)]
pub mod test_util {
    use super::*;
    use std::collections::HashMap;
    use std::sync::Mutex;

    /// Test stub: `add_code` inserts a known code → token mapping, `redeem`
    /// consumes on first call, errors afterwards.
    #[derive(Default)]
    pub struct StubPairingService {
        codes: Mutex<HashMap<String, Option<String>>>,
    }

    impl StubPairingService {
        pub fn add_code(&self, code: &str, mints: &str) {
            self.codes.lock().unwrap().insert(code.into(), Some(mints.into()));
        }
    }

    #[async_trait]
    impl PairingService for StubPairingService {
        async fn redeem(
            &self,
            code: &str,
            _device_label: &str,
        ) -> Result<PairOutcome, PairError> {
            let mut g = self.codes.lock().unwrap();
            match g.get_mut(code) {
                None => Err(PairError::UnknownCode),
                Some(slot) => match slot.take() {
                    Some(tok) => Ok(PairOutcome { engine_token: tok }),
                    None => Err(PairError::AlreadyConsumed),
                },
            }
        }
    }

    #[tokio::test]
    async fn stub_round_trip() {
        let svc = StubPairingService::default();
        svc.add_code("abc", "tok-123");
        let r = svc.redeem("abc", "iPhone").await.unwrap();
        assert_eq!(r.engine_token, "tok-123");
        matches!(svc.redeem("abc", "iPhone").await.unwrap_err(), PairError::AlreadyConsumed);
        matches!(svc.redeem("nope", "iPhone").await.unwrap_err(), PairError::UnknownCode);
    }
}
