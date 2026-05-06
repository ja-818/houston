//! Unified error type mapped to protocol `ErrorCode`.

use houston_engine_protocol::ErrorCode;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum CoreError {
    #[error("not found: {0}")]
    NotFound(String),
    #[error("conflict: {0}")]
    Conflict(String),
    #[error("bad request: {0}")]
    BadRequest(String),
    #[error("unavailable: {0}")]
    Unavailable(String),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("json error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("internal: {0}")]
    Internal(String),
    /// Error with a stable machine-readable `kind` tag the UI matches on
    /// to render plain-English copy without parsing the message string.
    /// Surfaces as `error.details.kind` on the wire.
    #[error("{message}")]
    Labeled {
        code: ErrorCode,
        kind: &'static str,
        message: String,
    },
}

impl CoreError {
    pub fn code(&self) -> ErrorCode {
        match self {
            Self::NotFound(_) => ErrorCode::NotFound,
            Self::Conflict(_) => ErrorCode::Conflict,
            Self::BadRequest(_) => ErrorCode::BadRequest,
            Self::Unavailable(_) => ErrorCode::Unavailable,
            Self::Labeled { code, .. } => *code,
            _ => ErrorCode::Internal,
        }
    }

    /// Stable machine-readable tag for typed errors. UI matches on this.
    pub fn kind(&self) -> Option<&'static str> {
        match self {
            Self::Labeled { kind, .. } => Some(kind),
            _ => None,
        }
    }
}

pub type CoreResult<T> = Result<T, CoreError>;
