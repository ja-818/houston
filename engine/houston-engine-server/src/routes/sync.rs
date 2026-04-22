//! `/v1/sync` REST routes — desktop ↔ mobile relay session control.
//!
//! Engine is the WS authority for sync events: incoming relay messages
//! flow through `EventSink` and out on the `sync` topic over `/v1/ws`.

use crate::routes::error::ApiError;
use crate::state::ServerState;
use axum::{extract::State, routing::post, Json, Router};
use houston_engine_core::sync::{SyncInfo, DEFAULT_RELAY_URL};
use houston_sync::SyncMessage;
use serde::Deserialize;
use std::sync::Arc;

pub fn router() -> Router<Arc<ServerState>> {
    Router::new()
        .route("/sync", post(start).delete(stop).get(status))
        .route("/sync/messages", post(send))
}

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
struct StartReq {
    relay_url: Option<String>,
}

async fn start(
    State(st): State<Arc<ServerState>>,
    body: Option<Json<StartReq>>,
) -> Json<SyncInfo> {
    let relay = body
        .and_then(|Json(b)| b.relay_url)
        .or_else(|| std::env::var("HOUSTON_RELAY_URL").ok())
        .unwrap_or_else(|| DEFAULT_RELAY_URL.to_string());
    Json(st.engine.sync.start(&relay, st.engine.events.clone()).await)
}

async fn stop(State(st): State<Arc<ServerState>>) {
    st.engine.sync.stop().await;
}

async fn status(State(st): State<Arc<ServerState>>) -> Json<Option<SyncInfo>> {
    Json(st.engine.sync.status().await)
}

async fn send(
    State(st): State<Arc<ServerState>>,
    Json(msg): Json<SyncMessage>,
) -> Result<(), ApiError> {
    Ok(st.engine.sync.send(msg).await?)
}
