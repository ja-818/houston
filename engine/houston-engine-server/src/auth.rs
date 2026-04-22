//! Bearer token auth middleware.

use crate::state::ServerState;
use axum::{
    extract::{Request, State},
    http::{header, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
    Json,
};
use houston_engine_protocol::{ErrorBody, ErrorCode, ErrorDetail};
use std::sync::Arc;

pub async fn require_bearer(
    State(state): State<Arc<ServerState>>,
    req: Request,
    next: Next,
) -> Response {
    // WS upgrade carries the token via `Sec-WebSocket-Protocol` (browsers can't set Authorization).
    // Also accept `?token=` for simple CLI clients.
    let auth_ok = check_header(&req, &state.config.token)
        || check_subprotocol(&req, &state.config.token)
        || check_query(&req, &state.config.token);

    if auth_ok {
        next.run(req).await
    } else {
        unauthorized()
    }
}

fn check_header(req: &Request, expected: &str) -> bool {
    req.headers()
        .get(header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.strip_prefix("Bearer "))
        .map(|t| constant_time_eq(t.as_bytes(), expected.as_bytes()))
        .unwrap_or(false)
}

fn check_subprotocol(req: &Request, expected: &str) -> bool {
    req.headers()
        .get("sec-websocket-protocol")
        .and_then(|v| v.to_str().ok())
        .map(|s| {
            s.split(',')
                .map(|p| p.trim())
                .any(|p| {
                    p.strip_prefix("houston-bearer.")
                        .map(|t| constant_time_eq(t.as_bytes(), expected.as_bytes()))
                        .unwrap_or(false)
                })
        })
        .unwrap_or(false)
}

fn check_query(req: &Request, expected: &str) -> bool {
    req.uri()
        .query()
        .and_then(|q| {
            q.split('&')
                .find_map(|kv| kv.strip_prefix("token="))
        })
        .map(|t| constant_time_eq(t.as_bytes(), expected.as_bytes()))
        .unwrap_or(false)
}

fn constant_time_eq(a: &[u8], b: &[u8]) -> bool {
    if a.len() != b.len() {
        return false;
    }
    let mut diff = 0u8;
    for (x, y) in a.iter().zip(b.iter()) {
        diff |= x ^ y;
    }
    diff == 0
}

fn unauthorized() -> Response {
    (
        StatusCode::UNAUTHORIZED,
        Json(ErrorBody {
            error: ErrorDetail {
                code: ErrorCode::Unauthorized,
                message: "Missing or invalid bearer token".into(),
                details: None,
            },
        }),
    )
        .into_response()
}
