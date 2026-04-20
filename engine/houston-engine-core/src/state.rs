//! `EngineState` — the runtime container passed to every route handler.

use crate::paths::EnginePaths;
use crate::sessions::SessionRuntime;
use crate::sync::SyncRuntime;
use houston_db::Database;
use houston_ui_events::DynEventSink;
use std::sync::Arc;

#[derive(Clone)]
pub struct EngineState {
    pub paths: EnginePaths,
    pub events: DynEventSink,
    pub db: Database,
    /// Per-engine session state (Claude-session-ID tracker, pid map).
    pub sessions: SessionRuntime,
    /// Mobile sync runtime — engine is the WS authority.
    pub sync: SyncRuntime,
}

impl EngineState {
    pub fn new(paths: EnginePaths, events: DynEventSink, db: Database) -> Self {
        Self {
            paths,
            events,
            db,
            sessions: SessionRuntime::default(),
            sync: SyncRuntime::new(),
        }
    }
}

pub type SharedEngineState = Arc<EngineState>;
