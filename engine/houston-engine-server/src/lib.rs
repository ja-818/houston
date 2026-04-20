//! houston-engine-server — axum HTTP+WS server.
//!
//! Binary: `houston-engine`. Speaks `houston-engine-protocol` over HTTP and
//! WebSocket. Frontend-agnostic: every client (desktop, mobile, CLI,
//! third-party) talks to it over the wire.

pub mod auth;
pub mod config;
pub mod routes;
pub mod state;
pub mod ws;

use axum::{
    http::{HeaderValue, Method},
    middleware,
    routing::get,
    Router,
};
use std::sync::Arc;
use tower_http::cors::CorsLayer;

pub use config::ServerConfig;
pub use state::ServerState;

/// Build the full axum router for the engine.
pub fn build_router(state: Arc<ServerState>) -> Router {
    let v1 = Router::new()
        .route("/health", get(routes::health::health))
        .route("/version", get(routes::health::version))
        .route("/ws", get(ws::ws_upgrade))
        .merge(routes::workspaces::router())
        .merge(routes::preferences::router())
        .merge(routes::conversations::router())
        .merge(routes::providers::router())
        .merge(routes::agent_configs::router())
        .merge(routes::sessions::router())
        .merge(routes::skills::router())
        .merge(routes::attachments::router())
        .merge(routes::worktree::router())
        .merge(routes::store::router())
        .merge(routes::routines::router())
        .merge(routes::agents::router())
        .merge(routes::agent_files::router())
        .merge(routes::composio::router())
        .merge(routes::sync::router())
        .layer(middleware::from_fn_with_state(
            state.clone(),
            auth::require_bearer,
        ))
        .layer(middleware::from_fn(routes::version_header));

    Router::new()
        .nest("/v1", v1)
        .layer(
            CorsLayer::new()
                .allow_origin("*".parse::<HeaderValue>().unwrap())
                .allow_methods([Method::GET, Method::POST, Method::DELETE, Method::PATCH])
                .allow_headers(tower_http::cors::Any),
        )
        .with_state(state)
}
