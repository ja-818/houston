//! Session lifecycle — transport-neutral orchestration layer.
//!
//! Each Houston "session" is one running Claude/Codex CLI subprocess with a
//! stable `session_key` so follow-up turns can `--resume`. This module owns:
//!
//! - [`SessionRuntime`] — per-engine state (Claude session-ID tracker,
//!   session-key → PID map). Held on `EngineState`, cloned per request.
//! - [`start`] — spawn + monitor a session via
//!   `houston-agents-conversations`, streaming updates to the engine's event
//!   sink (which WS clients subscribe to via `session:{key}` topics).
//! - [`cancel`] — SIGTERM the running CLI for a given session_key and emit
//!   a "Stopped by user" feed item + `completed` status.
//! - [`resolve_provider`] — agent-config → workspace → default fallback.
//!
//! Callers (REST handlers, Tauri adapter) supply the already-resolved
//! `working_dir` and an optional pre-built `system_prompt`. Prompt assembly
//! lives in the adapter today; it will move into `engine-core` in a later
//! phase once `agent_store` is ported.

pub mod history;
pub mod provider;
pub mod summarize;

use crate::agents::prompt as agent_prompt;
use crate::paths::EnginePaths;
use houston_agents_conversations::session_id_tracker::SessionIdTracker;
use houston_agents_conversations::session_pids::SessionPidMap;
use houston_agents_conversations::session_runner::{self, PersistOptions};
use houston_db::Database;
use houston_terminal_manager::{FeedItem, Provider};
use houston_ui_events::{DynEventSink, HoustonEvent};
use std::path::PathBuf;

pub use provider::{resolve_provider, ResolvedProvider};

/// Engine-owned session state. Cheap to clone.
#[derive(Default, Clone)]
pub struct SessionRuntime {
    pub session_ids: SessionIdTracker,
    pub pid_map: SessionPidMap,
}

/// Parameters for [`start`]. Mirrors the shape of the old Tauri `send_message`
/// command but with every field transport-neutral.
#[derive(Debug, Clone)]
pub struct StartParams {
    /// Agent directory on disk (already `~`-expanded, absolute).
    pub agent_dir: PathBuf,
    /// Working directory the subprocess runs in. Usually same as `agent_dir`.
    pub working_dir: PathBuf,
    /// Stable key identifying this conversation slot.
    pub session_key: String,
    /// User-typed prompt for this turn.
    pub prompt: String,
    /// Pre-built system prompt (CLAUDE.md + seed + Composio guidance etc.).
    /// Engine does not assemble this today — caller supplies.
    pub system_prompt: Option<String>,
    /// Who sent the message. `"desktop"` by default.
    pub source: Option<String>,
    /// Resolved provider + model (caller either passes an override or calls
    /// [`resolve_provider`] first).
    pub provider: Provider,
    pub model: Option<String>,
}

/// Start a session — spawns the CLI subprocess and a monitor task that
/// streams events into the engine's [`DynEventSink`]. Returns the
/// `session_key` so REST handlers can echo it back.
pub async fn start(
    rt: &SessionRuntime,
    events: DynEventSink,
    db: Database,
    app_system_prompt: &str,
    params: StartParams,
) -> Result<String, crate::CoreError> {
    let StartParams {
        agent_dir,
        working_dir,
        session_key,
        prompt,
        system_prompt,
        source,
        provider,
        model,
    } = params;

    if !agent_dir.exists() {
        std::fs::create_dir_all(&agent_dir)?;
    }
    agent_prompt::seed_agent(&agent_dir).map_err(crate::CoreError::Internal)?;

    // Final system prompt is always `<product_prompt>\n\n---\n\n<agent_context>`.
    // - `product_prompt`: caller-supplied if present, otherwise whatever the
    //   embedding app (Houston desktop) passed in via `HOUSTON_APP_SYSTEM_PROMPT`.
    // - `agent_context`: assembled by the engine from disk (working-dir header,
    //   mode overlay, skills index, integrations list). Product-neutral.
    let agent_context = agent_prompt::build_agent_context(
        &agent_dir,
        Some(working_dir.as_path()),
        None,
    );
    let product_prompt = system_prompt
        .as_deref()
        .filter(|s| !s.is_empty())
        .unwrap_or(app_system_prompt);
    let system_prompt = if product_prompt.is_empty() {
        Some(agent_context)
    } else {
        Some(format!("{product_prompt}\n\n---\n\n{agent_context}"))
    };

    let source = source.unwrap_or_else(|| "desktop".to_string());
    let agent_key = format!("{}:{}", working_dir.to_string_lossy(), session_key);
    let sid_handle = rt
        .session_ids
        .get_for_session(&agent_key, &working_dir, &session_key)
        .await;
    let resume_id = sid_handle.get().await;

    tracing::info!(
        "[sessions] start agent_dir={} session_key={} resume_id={:?} provider={}",
        agent_dir.display(),
        session_key,
        resume_id,
        provider,
    );

    let agent_path = agent_dir.to_string_lossy().to_string();

    // Flip the matching board activity to "running" synchronously, before
    // the CLI subprocess spawns. Desktop UI pre-wrote this from the send
    // handler; moving it here means mobile (and any other client that
    // calls `startSession`) gets the same behavior without duplicating
    // logic. `ActivityChanged` fans out to every WS subscriber so every
    // mounted client invalidates its activity cache.
    match crate::agents::activity::set_status_by_session_key(
        &agent_dir,
        &session_key,
        "running",
    ) {
        Ok(Some(_)) => {
            events.emit(HoustonEvent::ActivityChanged {
                agent_path: agent_path.clone(),
            });
        }
        Ok(None) => { /* no matching activity — ad-hoc session, nothing to flip */ }
        Err(e) => {
            tracing::warn!(
                "[sessions] failed to flip activity to running: {e} (session_key={session_key})"
            );
        }
    }

    let persist = Some(PersistOptions {
        db,
        source,
        user_message: Some(prompt.clone()),
        claude_session_id: None,
    });

    let events_for_end = events.clone();
    let handle = session_runner::spawn_and_monitor(
        events,
        agent_path.clone(),
        session_key.clone(),
        prompt,
        resume_id,
        working_dir,
        system_prompt,
        Some(sid_handle),
        persist,
        Some(rt.pid_map.clone()),
        provider,
        model,
    );

    // Own the end-of-session activity flip engine-side. Before this, the
    // desktop UI listened for SessionStatus::Completed and wrote
    // `needs_you` from the client — which meant phone-only users (or
    // anyone with the desktop unfocused) got stuck on "running" forever.
    // Doing it here makes every client identical: await the runner's
    // join handle, pick a terminal status, write the file, emit the
    // change event for live UI refresh.
    let agent_dir_for_end = agent_dir.clone();
    let session_key_for_end = session_key.clone();
    let agent_path_for_end = agent_path;
    tokio::spawn(async move {
        let next_status = match handle.await {
            Ok(result) if result.error.is_none() => "needs_you",
            Ok(_) => "error",
            Err(e) => {
                tracing::warn!(
                    "[sessions] session runner panicked for session_key={session_key_for_end}: {e}"
                );
                "error"
            }
        };
        match crate::agents::activity::set_status_by_session_key(
            &agent_dir_for_end,
            &session_key_for_end,
            next_status,
        ) {
            Ok(Some(_)) => {
                tracing::info!(
                    "[sessions] end flip: session_key={session_key_for_end} status={next_status}"
                );
                events_for_end.emit(HoustonEvent::ActivityChanged {
                    agent_path: agent_path_for_end,
                });
            }
            Ok(None) => {
                tracing::info!(
                    "[sessions] end flip: no matching activity for session_key={session_key_for_end} (ad-hoc session — skipped)"
                );
            }
            Err(e) => {
                tracing::warn!(
                    "[sessions] failed to flip activity to {next_status}: {e} (session_key={session_key_for_end})"
                );
            }
        }
    });

    Ok(session_key)
}

/// Cancel a running session. Sends `SIGTERM` to the Claude CLI process and
/// emits a `Stopped by user` feed item + `completed` session status so the
/// UI can reconcile.
///
/// Returns `true` if a process was found and signaled, `false` if no session
/// was running under that key.
pub async fn cancel(
    rt: &SessionRuntime,
    events: &DynEventSink,
    agent_path: &str,
    session_key: &str,
) -> bool {
    let Some(pid) = rt.pid_map.remove(session_key).await else {
        return false;
    };
    tracing::info!("[sessions] cancel session_key={session_key} pid={pid}");

    // SIGTERM the CLI. Don't block on kill(1) in tests where the PID may be
    // stale — tokio Command::output().await can hang on Tauri macOS (see
    // tauri_subprocess_hang memory). A short timeout is cheap and safe.
    #[cfg(unix)]
    {
        use tokio::time::{timeout, Duration};
        let _ = timeout(Duration::from_millis(500), async {
            let _ = tokio::process::Command::new("kill")
                .arg("-TERM")
                .arg(pid.to_string())
                .kill_on_drop(true)
                .status()
                .await;
        })
        .await;
    }

    events.emit(HoustonEvent::FeedItem {
        agent_path: agent_path.to_string(),
        session_key: session_key.to_string(),
        item: FeedItem::SystemMessage("Stopped by user".into()),
    });
    events.emit(HoustonEvent::SessionStatus {
        agent_path: agent_path.to_string(),
        session_key: session_key.to_string(),
        status: "completed".into(),
        error: None,
    });
    true
}

/// Start an onboarding session: seeds the agent and runs the first turn with
/// onboarding guidance baked into the system prompt.
///
/// Mirrors the former Tauri `start_onboarding_session` command. Uses the
/// agent/workspace-resolved provider (no override surface) because onboarding
/// runs before the user has tuned anything.
pub async fn start_onboarding(
    rt: &SessionRuntime,
    events: DynEventSink,
    db: Database,
    paths: &EnginePaths,
    app_system_prompt: &str,
    app_onboarding_prompt: &str,
    agent_dir: PathBuf,
    session_key: String,
) -> Result<String, crate::CoreError> {
    agent_prompt::seed_agent(&agent_dir).map_err(crate::CoreError::Internal)?;

    // Onboarding system prompt = product prompt + onboarding suffix. Engine
    // appends its own agent context in `start()` below.
    let product_prompt = format!("{app_system_prompt}{app_onboarding_prompt}");

    let resolved = resolve_provider(paths, &agent_dir);

    start(
        rt,
        events,
        db,
        app_system_prompt,
        StartParams {
            agent_dir: agent_dir.clone(),
            working_dir: agent_dir,
            session_key,
            prompt: ".".to_string(),
            system_prompt: Some(product_prompt),
            source: Some("desktop".into()),
            provider: resolved.provider,
            model: resolved.model,
        },
    )
    .await
}

/// Expand a leading `~` to `$HOME`. Mirrors the one-liner the Tauri adapter
/// used so engine and adapter agree on path resolution.
pub fn expand_tilde(p: &std::path::Path) -> PathBuf {
    let s = p.to_string_lossy();
    if let Some(rest) = s.strip_prefix("~/") {
        if let Some(home) = dirs_next::home_dir() {
            return home.join(rest);
        }
    }
    p.to_path_buf()
}

/// Convenience: resolve an agent directory relative to an [`EnginePaths`]
/// docs root, returning an absolute path. If the caller passes an absolute
/// path, it's returned unchanged.
pub fn resolve_agent_dir(paths: &EnginePaths, agent_path: &str) -> PathBuf {
    let p = std::path::Path::new(agent_path);
    if p.is_absolute() {
        return expand_tilde(p);
    }
    if agent_path.starts_with("~/") {
        return expand_tilde(p);
    }
    paths.docs().join(agent_path)
}
