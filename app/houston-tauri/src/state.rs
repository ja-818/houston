use houston_db::Database;
use houston_events::EventQueueHandle;
use houston_scheduler::Scheduler;
use std::sync::Arc;
use tokio::sync::Mutex;

/// Generic application state for Houston-based Tauri apps.
/// Register with `app.manage(AppState { db, .. })` during Tauri setup.
pub struct AppState {
    pub db: Database,
    /// Handle to push events into the queue. None if event system not initialized.
    pub event_queue: Option<EventQueueHandle>,
    /// Scheduler for heartbeats and cron jobs. None if not initialized.
    pub scheduler: Option<Arc<Mutex<Scheduler>>>,
}
