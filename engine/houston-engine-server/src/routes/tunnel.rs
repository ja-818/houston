//! `/v1/tunnel` — pairing + status + device-token management.
//!
//! - `GET  /v1/tunnel/status`                        current connection
//! - `POST /v1/tunnel/pairing`                       mint a 6-digit code
//! - `GET  /v1/tunnel/devices`                       paired devices list
//! - `POST /v1/tunnel/devices/:hash/revoke`          kill one device

use crate::routes::error::ApiError;
use crate::state::ServerState;
use axum::{
    extract::{Path, State},
    routing::{get, post},
    Json, Router,
};
use houston_engine_core::CoreError;
use serde::Serialize;
use std::sync::Arc;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TunnelStatus {
    pub connected: bool,
    pub tunnel_id: Option<String>,
    pub public_host: Option<String>,
    pub last_ping_ms: Option<i64>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PairingCode {
    /// Full code mobile should POST to `/pair/` on the relay:
    /// `<tunnelId>-<userCode>`. Never include raw `userCode` without the
    /// prefix — the relay routes on the prefix.
    pub code: String,
    pub user_code: String,
    pub expires_at: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PairedDevice {
    pub hash: String,
    pub label: String,
    pub created_at: String,
    pub last_seen_at: Option<String>,
}

pub fn router() -> Router<Arc<ServerState>> {
    Router::new()
        .route("/tunnel/status", get(status))
        .route("/tunnel/pairing", post(mint_pairing))
        .route("/tunnel/devices", get(list_devices))
        .route("/tunnel/devices/:hash/revoke", post(revoke_device))
}

async fn status(State(st): State<Arc<ServerState>>) -> Json<TunnelStatus> {
    let id = st.tunnel_identity.clone();
    Json(TunnelStatus {
        connected: st.tunnel_running.load(std::sync::atomic::Ordering::Relaxed),
        tunnel_id: id.as_ref().map(|i| i.tunnel_id.clone()),
        public_host: id.as_ref().map(|i| i.public_host.clone()),
        last_ping_ms: None, // TODO wire from connection layer
    })
}

async fn mint_pairing(
    State(st): State<Arc<ServerState>>,
) -> Result<Json<PairingCode>, ApiError> {
    let Some(identity) = &st.tunnel_identity else {
        return Err(ApiError(CoreError::Unavailable(
            "Tunnel allocation hasn't completed yet. The engine's first boot needs network to reach the Houston relay, then pairing becomes available on the next restart.".into(),
        )));
    };
    let user_code = st.pair_store.mint_code();
    let code = format!("{}-{}", identity.tunnel_id, user_code);
    let expires_at = (chrono::Utc::now() + chrono::Duration::minutes(5)).to_rfc3339();
    Ok(Json(PairingCode {
        code,
        user_code,
        expires_at,
    }))
}

async fn list_devices(
    State(st): State<Arc<ServerState>>,
) -> Result<Json<Vec<PairedDevice>>, ApiError> {
    let rows = st
        .engine
        .db
        .list_active_engine_tokens()
        .await
        .map_err(|e| ApiError(CoreError::Internal(e.to_string())))?;
    Ok(Json(
        rows.into_iter()
            .map(|r| PairedDevice {
                hash: r.token_hash,
                label: r.device_label,
                created_at: r.created_at,
                last_seen_at: r.last_seen_at,
            })
            .collect(),
    ))
}

async fn revoke_device(
    State(st): State<Arc<ServerState>>,
    Path(hash): Path<String>,
) -> Result<(), ApiError> {
    st.engine
        .db
        .revoke_engine_token(&hash)
        .await
        .map_err(|e| ApiError(CoreError::Internal(e.to_string())))?;
    Ok(())
}
