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
}

impl CoreError {
    pub fn code(&self) -> ErrorCode {
        match self {
            Self::NotFound(_) => ErrorCode::NotFound,
            Self::Conflict(_) => ErrorCode::Conflict,
            Self::BadRequest(_) => ErrorCode::BadRequest,
            Self::Unavailable(_) => ErrorCode::Unavailable,
            _ => ErrorCode::Internal,
        }
    }
}

pub type CoreResult<T> = Result<T, CoreError>;
