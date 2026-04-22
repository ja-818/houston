//! `/v1/preferences` REST routes.

use crate::routes::error::ApiError;
use crate::state::ServerState;
use axum::{
    extract::{Path, State},
    routing::get,
    Json, Router,
};
use houston_engine_core::preferences;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SetPreference {
    pub value: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PreferenceValue {
    pub value: Option<String>,
}

pub fn router() -> Router<Arc<ServerState>> {
    Router::new().route("/preferences/:key", get(fetch).put(upsert))
}

async fn fetch(
    State(st): State<Arc<ServerState>>,
    Path(key): Path<String>,
) -> Result<Json<PreferenceValue>, ApiError> {
    let value = preferences::get(&st.engine.db, &key).await?;
    Ok(Json(PreferenceValue { value }))
}

async fn upsert(
    State(st): State<Arc<ServerState>>,
    Path(key): Path<String>,
    Json(req): Json<SetPreference>,
) -> Result<(), ApiError> {
    preferences::set(&st.engine.db, &key, &req.value).await?;
    // Push a tz change into every running scheduler so existing cron jobs
    // reflect the new zone without requiring an agent restart.
    if key == preferences::TIMEZONE_KEY {
        st.routine_scheduler.update_default_tz(&req.value).await;
    }
    Ok(())
}
