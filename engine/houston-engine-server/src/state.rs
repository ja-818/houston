//! Shared server state — cheap to clone via `Arc`.

use crate::config::ServerConfig;
use crate::pair_store::PairStore;
use anyhow::{Context, Result};
use houston_db::Database;
use houston_engine_core::routines::scheduler::RoutineSchedulerState;
use houston_engine_core::{paths::EnginePaths, EngineState};
use houston_file_watcher::WatcherState;
use houston_tunnel::TunnelIdentity;
use houston_ui_events::BroadcastEventSink;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;

/// Server state shared across request handlers.
pub struct ServerState {
    pub config: ServerConfig,
    /// Broadcast channel for WebSocket fanout. Every WS client subscribes.
    pub events: BroadcastEventSink,
    /// Engine runtime container (DB, paths, sinks).
    pub engine: EngineState,
    /// Routine scheduler (per-agent cron). `Option` inside so start/stop can
    /// swap it without dropping the outer state.
    pub routine_scheduler: RoutineSchedulerState,
    /// Agent file watcher.
    pub watcher: WatcherState,
    /// Tunnel identity. `None` only while `/allocate` hasn't succeeded yet
    /// (first boot without network); pairing endpoints return 503 in that
    /// window. Once allocated, identity is cached in `tunnel.json` and
    /// persists across restarts.
    pub tunnel_identity: Option<TunnelIdentity>,
    /// Pairing-code store. Always present — `mint_pairing` 503s instead
    /// when `tunnel_identity` is still `None`.
    pub pair_store: PairStore,
    /// Flipped to `true` while the tunnel client is alive + dialed.
    pub tunnel_running: Arc<AtomicBool>,
}

impl ServerState {
    /// Initialise state with a file-backed DB at `<home>/db/houston.db`.
    ///
    /// `tunnel_identity` is the relay handshake result — `Some` once
    /// `houston_tunnel::ensure` returns, `None` if the first-boot
    /// allocation failed (engine keeps running local-only until the
    /// next boot succeeds).
    pub async fn new(
        config: ServerConfig,
        tunnel_identity: Option<TunnelIdentity>,
    ) -> Result<Self> {
        let db_path = config.home_dir.join("db").join("houston.db");
        let db = Database::connect(&db_path)
            .await
            .context("Failed to open engine DB")?;
        Ok(Self::with_db(config, db, tunnel_identity))
    }

    /// Initialise state with an in-memory DB — for tests.
    pub async fn new_in_memory(config: ServerConfig) -> Result<Self> {
        let db = Database::connect_in_memory()
            .await
            .context("Failed to open in-memory engine DB")?;
        Ok(Self::with_db(config, db, None))
    }

    fn with_db(
        config: ServerConfig,
        db: Database,
        tunnel_identity: Option<TunnelIdentity>,
    ) -> Self {
        let events = BroadcastEventSink::new(1024);
        let paths = EnginePaths::new(config.docs_dir.clone(), config.home_dir.clone());

        let engine = EngineState::new(paths, Arc::new(events.clone()), db.clone())
            .with_app_prompts(
                config.app_system_prompt.clone(),
                config.app_onboarding_prompt.clone(),
            );

        let pair_store = PairStore::new(db);

        Self {
            config,
            events,
            engine,
            routine_scheduler: RoutineSchedulerState::default(),
            watcher: WatcherState::default(),
            tunnel_identity,
            pair_store,
            tunnel_running: Arc::new(AtomicBool::new(false)),
        }
    }
}
