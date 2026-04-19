//! `EngineState` — the runtime container passed to every route handler.

use crate::paths::EnginePaths;
use houston_db::Database;
use houston_ui_events::DynEventSink;
use std::sync::Arc;

#[derive(Clone)]
pub struct EngineState {
    pub paths: EnginePaths,
    pub events: DynEventSink,
    pub db: Database,
}

impl EngineState {
    pub fn new(paths: EnginePaths, events: DynEventSink, db: Database) -> Self {
        Self { paths, events, db }
    }
}

pub type SharedEngineState = Arc<EngineState>;
