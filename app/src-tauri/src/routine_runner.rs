//! Routine runner — fires routines on schedule, evaluates suppression, surfaces activities.
//!
//! - `RoutineScheduler`: managed state that syncs cron tasks for the active agent.
//! - `run_routine()`: core execution logic (create run → session → evaluate → surface).
//! - `run_routine_now`: Tauri command for manual "Run now" trigger.

use crate::agent;
use chrono::Utc;
use cron::Schedule;
use houston_tauri::session_id_tracker::SessionIdTracker;
use houston_tauri::agent_store::types::{ActivityUpdate, RoutineRunUpdate};
use houston_tauri::agent_store::AgentStore;
use houston_tauri::events::HoustonEvent;
use houston_tauri::paths::expand_tilde;
use houston_tauri::session_runner::PersistOptions;
use houston_tauri::state::AppState;
use std::collections::HashMap;
use std::path::PathBuf;
use std::str::FromStr;
use std::sync::Arc;
use tauri::{Emitter, Manager};
use tokio::sync::{watch, Mutex};

/// The suppression token that the model uses to signal "nothing to report".
const ROUTINE_OK_TOKEN: &str = "ROUTINE_OK";

/// Instruction appended to routine prompts when `suppress_when_silent` is true.
const SUPPRESSION_INSTRUCTION: &str = "\n\n---\n\
IMPORTANT: If nothing requires the user's attention or action, \
end your response with exactly \"ROUTINE_OK\" (on its own line). \
If something needs the user's attention, respond with your findings \
— do NOT include \"ROUTINE_OK\".";

/// Managed state for the routine scheduler.
pub struct RoutineSchedulerState(pub Arc<Mutex<Option<RoutineScheduler>>>);

impl Default for RoutineSchedulerState {
    fn default() -> Self {
        Self(Arc::new(Mutex::new(None)))
    }
}

/// Manages cron tasks for one agent directory.
pub struct RoutineScheduler {
    agent_path: String,
    jobs: HashMap<String, tokio::task::JoinHandle<()>>,
    shutdown_tx: watch::Sender<bool>,
}

impl RoutineScheduler {
    pub fn new(agent_path: &str) -> Self {
        let (shutdown_tx, _) = watch::channel(false);
        Self {
            agent_path: agent_path.to_string(),
            jobs: HashMap::new(),
            shutdown_tx,
        }
    }

    /// Read routines from disk and sync cron tasks (add new, remove deleted, update changed).
    pub fn sync(&mut self, app_handle: &tauri::AppHandle) {
        let dir = expand_tilde(&PathBuf::from(&self.agent_path));
        let store = AgentStore::new(&dir);
        let routines = store.list_routines().unwrap_or_default();

        // Collect IDs of enabled routines
        let active_ids: HashMap<String, _> = routines
            .iter()
            .filter(|r| r.enabled)
            .map(|r| (r.id.clone(), r.schedule.clone()))
            .collect();

        // Remove jobs for routines that are no longer active
        let to_remove: Vec<String> = self
            .jobs
            .keys()
            .filter(|id| !active_ids.contains_key(*id))
            .cloned()
            .collect();
        for id in to_remove {
            if let Some(handle) = self.jobs.remove(&id) {
                handle.abort();
                tracing::info!("[routines] Stopped cron for routine {id}");
            }
        }

        // Add jobs for new active routines
        for routine in &routines {
            if !routine.enabled || self.jobs.contains_key(&routine.id) {
                continue;
            }
            match self.spawn_cron(app_handle, routine) {
                Ok(handle) => {
                    tracing::info!(
                        "[routines] Started cron for '{}' ({})",
                        routine.name, routine.schedule
                    );
                    self.jobs.insert(routine.id.clone(), handle);
                }
                Err(e) => {
                    tracing::error!(
                        "[routines] Failed to start cron for '{}': {e}",
                        routine.name
                    );
                }
            }
        }
    }

    fn spawn_cron(
        &self,
        app_handle: &tauri::AppHandle,
        routine: &houston_tauri::agent_store::types::Routine,
    ) -> Result<tokio::task::JoinHandle<()>, String> {
        // Convert 5-field cron to 7-field (add seconds prefix, year suffix)
        let cron_7 = format!("0 {} *", routine.schedule);
        let schedule = Schedule::from_str(&cron_7)
            .map_err(|e| format!("Invalid cron '{}': {e}", routine.schedule))?;

        let handle = app_handle.clone();
        let agent_path = self.agent_path.clone();
        let routine_id = routine.id.clone();
        let mut shutdown_rx = self.shutdown_tx.subscribe();

        Ok(tokio::spawn(async move {
            loop {
                let next = match schedule.upcoming(Utc).next() {
                    Some(t) => t,
                    None => return,
                };

                let delay = next.signed_duration_since(Utc::now());
                let sleep_dur = if delay.num_milliseconds() > 0 {
                    std::time::Duration::from_millis(delay.num_milliseconds() as u64)
                } else {
                    std::time::Duration::from_millis(0)
                };

                tokio::select! {
                    _ = tokio::time::sleep(sleep_dur) => {}
                    _ = shutdown_rx.changed() => {
                        if *shutdown_rx.borrow() {
                            return;
                        }
                    }
                }

                tracing::info!(
                    "[routines] Cron fired for routine {routine_id} at {}",
                    Utc::now().to_rfc3339()
                );

                if let Err(e) = run_routine(&handle, &agent_path, &routine_id).await {
                    tracing::error!("[routines] Error running routine {routine_id}: {e}");
                }
            }
        }))
    }

    pub fn shutdown(&mut self) {
        let _ = self.shutdown_tx.send(true);
        for (id, handle) in self.jobs.drain() {
            handle.abort();
            tracing::info!("[routines] Stopped cron for routine {id}");
        }
    }
}

/// Core routine execution: create run → spawn session → evaluate → surface.
pub async fn run_routine(
    app_handle: &tauri::AppHandle,
    agent_path: &str,
    routine_id: &str,
) -> Result<(), String> {
    let working_dir = expand_tilde(&PathBuf::from(agent_path));
    let store = AgentStore::new(&working_dir);

    // Load the routine
    let routines = store.list_routines()?;
    let routine = routines
        .iter()
        .find(|r| r.id == routine_id)
        .ok_or_else(|| format!("Routine not found: {routine_id}"))?
        .clone();

    // Create a run record
    store.ensure_houston_dir()?;
    let run = store.create_routine_run(routine_id)?;
    let _ = app_handle.emit(
        "houston-event",
        HoustonEvent::RoutineRunsChanged {
            agent_path: agent_path.to_string(),
        },
    );

    // Seed agent files and build system prompt
    agent::seed_agent(&working_dir)?;
    let system_prompt = agent::build_system_prompt(&working_dir, None, None);

    // Build the prompt with optional suppression instruction
    let prompt = if routine.suppress_when_silent {
        format!("{}{SUPPRESSION_INSTRUCTION}", routine.prompt)
    } else {
        routine.prompt.clone()
    };

    // Get session id handle for --resume
    let session_ids = app_handle.state::<SessionIdTracker>();
    let state = app_handle.state::<AppState>();
    let agent_key = format!(
        "{}:{}",
        working_dir.to_string_lossy(),
        run.session_key
    );
    let sid_handle = session_ids
        .get_for_session(&agent_key, agent_path, &run.session_key)
        .await;
    let resume_id = sid_handle.get().await;

    // Spawn session and wait for completion
    let join_handle = houston_tauri::session_runner::spawn_and_monitor(
        app_handle,
        agent_path.to_string(),
        run.session_key.clone(),
        prompt.clone(),
        resume_id,
        working_dir.clone(),
        Some(system_prompt),
        Some(sid_handle),
        Some(PersistOptions {
            db: state.db.clone(),
            source: "routine".into(),
            user_message: Some(prompt),
            claude_session_id: None,
        }),
        None,
        houston_tauri::houston_sessions::Provider::Anthropic,
        None,
    );

    let result = join_handle
        .await
        .map_err(|e| format!("Session task failed: {e}"))?;

    let now = Utc::now().to_rfc3339();

    // Evaluate suppression
    let response = result.response_text.unwrap_or_default();
    let is_silent = routine.suppress_when_silent && response_is_silent(&response);

    if is_silent {
        // Silent — update run, no activity created
        let summary = extract_summary(&response);
        store.update_routine_run(
            &run.id,
            RoutineRunUpdate {
                status: Some("silent".into()),
                summary: Some(summary),
                completed_at: Some(now),
                ..Default::default()
            },
        )?;
    } else if result.error.is_some() {
        // Error
        store.update_routine_run(
            &run.id,
            RoutineRunUpdate {
                status: Some("error".into()),
                summary: result.error,
                completed_at: Some(now),
                ..Default::default()
            },
        )?;
    } else {
        // Surfaced — create activity on the board
        let title = format!(
            "{} — {}",
            routine.name,
            first_line(&response).unwrap_or("Needs attention")
        );
        let activity = store.create_activity(&title, &routine.description, None, None)?;

        // Set the activity fields to link back to the routine run
        store.update_activity(
            &activity.id,
            ActivityUpdate {
                status: Some("needs_you".into()),
                session_key: Some(run.session_key.clone()),
                routine_id: Some(routine.id.clone()),
                routine_run_id: Some(run.id.clone()),
                ..Default::default()
            },
        )?;

        store.update_routine_run(
            &run.id,
            RoutineRunUpdate {
                status: Some("surfaced".into()),
                activity_id: Some(activity.id.clone()),
                completed_at: Some(now),
                ..Default::default()
            },
        )?;

        // Emit activity changed so the board updates
        let _ = app_handle.emit(
            "houston-event",
            HoustonEvent::ActivityChanged {
                agent_path: agent_path.to_string(),
            },
        );

        // Send notification
        let _ = app_handle.emit(
            "houston-event",
            HoustonEvent::CompletionToast {
                title: format!("{} found something", routine.name),
                issue_id: None,
            },
        );
    }

    // Emit run changed
    let _ = app_handle.emit(
        "houston-event",
        HoustonEvent::RoutineRunsChanged {
            agent_path: agent_path.to_string(),
        },
    );

    Ok(())
}

/// Check if a response contains the ROUTINE_OK suppression token.
fn response_is_silent(response: &str) -> bool {
    let trimmed = response.trim();
    trimmed.ends_with(ROUTINE_OK_TOKEN) || trimmed.starts_with(ROUTINE_OK_TOKEN)
}

/// Extract a summary from a silent response (strip the ROUTINE_OK token).
fn extract_summary(response: &str) -> String {
    let trimmed = response.trim();
    let without_token = trimmed
        .replace(ROUTINE_OK_TOKEN, "")
        .trim()
        .to_string();
    if without_token.is_empty() {
        "Nothing to report".to_string()
    } else {
        truncate(&without_token, 200)
    }
}

/// Get the first non-empty line of text, truncated.
fn first_line(text: &str) -> Option<&str> {
    text.lines()
        .map(|l| l.trim())
        .find(|l| !l.is_empty())
}

fn truncate(s: &str, max: usize) -> String {
    if s.len() <= max {
        s.to_string()
    } else {
        format!("{}…", &s[..max - 1])
    }
}

// -- Tauri commands --

/// Manually trigger a routine (the "Run now" button).
#[tauri::command(rename_all = "snake_case")]
pub async fn run_routine_now(
    app_handle: tauri::AppHandle,
    agent_path: String,
    routine_id: String,
) -> Result<(), String> {
    run_routine(&app_handle, &agent_path, &routine_id).await
}

/// Start the routine scheduler for an agent. Called when switching to an agent.
#[tauri::command(rename_all = "snake_case")]
pub async fn start_routine_scheduler(
    app_handle: tauri::AppHandle,
    state: tauri::State<'_, RoutineSchedulerState>,
    agent_path: String,
) -> Result<(), String> {
    let mut guard = state.0.lock().await;
    // Stop any existing scheduler
    if let Some(ref mut scheduler) = *guard {
        scheduler.shutdown();
    }
    let mut scheduler = RoutineScheduler::new(&agent_path);
    scheduler.sync(&app_handle);
    *guard = Some(scheduler);
    Ok(())
}

/// Stop the routine scheduler. Called when leaving an agent.
#[tauri::command(rename_all = "snake_case")]
pub async fn stop_routine_scheduler(
    state: tauri::State<'_, RoutineSchedulerState>,
) -> Result<(), String> {
    let mut guard = state.0.lock().await;
    if let Some(ref mut scheduler) = *guard {
        scheduler.shutdown();
    }
    *guard = None;
    Ok(())
}

/// Re-sync the routine scheduler after routines change.
#[tauri::command(rename_all = "snake_case")]
pub async fn sync_routine_scheduler(
    app_handle: tauri::AppHandle,
    state: tauri::State<'_, RoutineSchedulerState>,
) -> Result<(), String> {
    let mut guard = state.0.lock().await;
    if let Some(ref mut scheduler) = *guard {
        scheduler.sync(&app_handle);
    }
    Ok(())
}
