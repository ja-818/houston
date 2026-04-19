//! Shared server state — cheap to clone via `Arc`.

use crate::config::ServerConfig;
use anyhow::{Context, Result};
use houston_db::Database;
use houston_engine_core::{paths::EnginePaths, EngineState};
use houston_ui_events::BroadcastEventSink;
use std::sync::Arc;

/// Server state shared across request handlers.
pub struct ServerState {
    pub config: ServerConfig,
    /// Broadcast channel for WebSocket fanout. Every WS client subscribes.
    pub events: BroadcastEventSink,
    /// Engine runtime container (DB, paths, sinks).
    pub engine: EngineState,
}

impl ServerState {
    /// Initialise state with a file-backed DB at `<home>/db/houston.db`.
    pub async fn new(config: ServerConfig) -> Result<Self> {
        let db_path = config.home_dir.join("db").join("houston.db");
        let db = Database::connect(&db_path)
            .await
            .context("Failed to open engine DB")?;
        Ok(Self::with_db(config, db))
    }

    /// Initialise state with an in-memory DB — for tests.
    pub async fn new_in_memory(config: ServerConfig) -> Result<Self> {
        let db = Database::connect_in_memory()
            .await
            .context("Failed to open in-memory engine DB")?;
        Ok(Self::with_db(config, db))
    }

    fn with_db(config: ServerConfig, db: Database) -> Self {
        let events = BroadcastEventSink::new(1024);
        let paths = EnginePaths::new(config.docs_dir.clone(), config.home_dir.clone());
        let engine = EngineState::new(paths, Arc::new(events.clone()), db);
        Self { config, events, engine }
    }
}
