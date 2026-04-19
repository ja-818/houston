//! `/v1/agents/{agent_path}/sessions` — session lifecycle routes.
//!
//! - `POST /v1/agents/{agent_path}/sessions` — start a new session turn.
//! - `POST /v1/agents/{agent_path}/sessions/{key}:cancel` — SIGTERM the
//!   running CLI for that session_key.
//!
//! `agent_path` is a single path segment and MUST be percent-encoded by the
//! caller if it contains slashes (normal for absolute paths like
//! `/Users/x/Documents/Houston/ws/agent` → `%2FUsers%2Fx%2F…`).
//!
//! Sessions stream updates over the WebSocket on the `session:{key}` topic.
//! Clients are responsible for subscribing to the topic BEFORE calling this
//! route (race-free: the forwarder drops events that arrive before
//! subscription, which is safe because the caller already has the
//! session_key echoed back from this response).

use crate::routes::error::ApiError;
use crate::state::ServerState;
use axum::{
    extract::{Path, State},
    routing::post,
    Json, Router,
};
use houston_engine_core::sessions::{
    self, resolve_agent_dir, resolve_provider, SessionRuntime, StartParams,
};
use houston_engine_core::CoreError;
use houston_terminal_manager::Provider;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

pub fn router() -> Router<Arc<ServerState>> {
    Router::new()
        .route(
            "/agents/:agent_path/sessions",
            post(start_session),
        )
        .route(
            "/agents/:agent_path/sessions/:key_action",
            post(cancel_session),
        )
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StartRequest {
    /// Stable conversation slot id. Required — the frontend owns this.
    pub session_key: String,
    pub prompt: String,
    /// Optional pre-built system prompt. Caller (Tauri adapter today) assembles
    /// CLAUDE.md + seed + integration guidance and passes the final string.
    #[serde(default)]
    pub system_prompt: Option<String>,
    #[serde(default)]
    pub source: Option<String>,
    /// Working-directory override. Defaults to `agent_dir`.
    #[serde(default)]
    pub working_dir: Option<String>,
    /// Provider override (`"anthropic"` or `"openai"`). Wins over the
    /// agent/workspace-resolved provider.
    #[serde(default)]
    pub provider: Option<String>,
    /// Model override. Wins over any resolved default.
    #[serde(default)]
    pub model: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StartResponse {
    pub session_key: String,
}

async fn start_session(
    State(st): State<Arc<ServerState>>,
    Path(agent_path): Path<String>,
    Json(req): Json<StartRequest>,
) -> Result<Json<StartResponse>, ApiError> {
    let agent_dir = resolve_agent_dir(&st.engine.paths, &agent_path);
    let working_dir = req
        .working_dir
        .as_deref()
        .map(|p| sessions::expand_tilde(std::path::Path::new(p)))
        .unwrap_or_else(|| agent_dir.clone());

    // Override > agent config > workspace > default.
    let ResolvedProviderChoice { provider, model } =
        resolve_provider_with_overrides(&st, &agent_dir, req.provider.as_deref(), req.model.clone())?;

    let params = StartParams {
        agent_dir,
        working_dir,
        session_key: req.session_key.clone(),
        prompt: req.prompt,
        system_prompt: req.system_prompt,
        source: req.source,
        provider,
        model,
    };

    let rt = SessionRuntime::clone(&st.engine.sessions);
    let sink = st.engine.events.clone();
    let db = st.engine.db.clone();
    let key = sessions::start(&rt, sink, db, params).await?;

    Ok(Json(StartResponse { session_key: key }))
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CancelResponse {
    pub cancelled: bool,
}

async fn cancel_session(
    State(st): State<Arc<ServerState>>,
    Path((agent_path, key_action)): Path<(String, String)>,
) -> Result<Json<CancelResponse>, ApiError> {
    let session_key = match key_action.strip_suffix(":cancel") {
        Some(k) if !k.is_empty() => k.to_string(),
        _ => {
            return Err(CoreError::BadRequest(format!(
                "path action must be `:cancel`, got {key_action:?}"
            ))
            .into());
        }
    };
    let agent_dir = resolve_agent_dir(&st.engine.paths, &agent_path);
    let agent_path_str = agent_dir.to_string_lossy().to_string();

    let cancelled = sessions::cancel(
        &st.engine.sessions,
        &st.engine.events,
        &agent_path_str,
        &session_key,
    )
    .await;
    Ok(Json(CancelResponse { cancelled }))
}

// ---------------------------------------------------------------------------

struct ResolvedProviderChoice {
    provider: Provider,
    model: Option<String>,
}

fn resolve_provider_with_overrides(
    st: &Arc<ServerState>,
    agent_dir: &std::path::Path,
    provider_override: Option<&str>,
    model_override: Option<String>,
) -> Result<ResolvedProviderChoice, ApiError> {
    if let Some(p_str) = provider_override {
        let provider: Provider = p_str
            .parse()
            .map_err(|e: String| CoreError::BadRequest(e))?;
        return Ok(ResolvedProviderChoice {
            provider,
            model: model_override,
        });
    }
    let mut resolved = resolve_provider(&st.engine.paths, agent_dir);
    if let Some(m) = model_override {
        resolved.model = Some(m);
    }
    Ok(ResolvedProviderChoice {
        provider: resolved.provider,
        model: resolved.model,
    })
}

