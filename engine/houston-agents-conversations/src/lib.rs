//! Orchestrates multi-session conversation lifecycle for Houston agents.
//!
//! Sits ABOVE `houston-terminal-manager` (raw CLI subprocess) and BELOW the Tauri
//! command layer. Responsibilities:
//!
//! - `session_runner` — spawn a CLI session, stream updates, emit UI events,
//!   optionally persist feed items to the database, track the Claude session
//!   ID for `--resume`.
//! - `session_id_tracker` — per-conversation Claude session ID registry with
//!   disk persistence (`.houston/sessions/{key}.sid`).
//! - `session_pids` — map of `session_key → pid` so stop requests can kill
//!   the right subprocess.
//! - `supervisor` — panic-isolating wrapper so one session crashing doesn't
//!   unwind the whole app.

pub mod session_id_tracker;
pub mod session_pids;
pub mod session_runner;
pub mod supervisor;
