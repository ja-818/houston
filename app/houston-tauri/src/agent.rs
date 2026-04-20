//! Re-export shim over `houston_engine_core::agents::prompt`.
//!
//! Phase 2D relocated the prompt-assembly helpers (`seed_file`,
//! `build_system_prompt`, `list_files`, `read_file`, `AgentFileInfo`) into the
//! engine. This module preserves the `houston_tauri::agent::*` import path so
//! `app/src-tauri/src/agent.rs` can keep calling `kw::seed_file(...)` without
//! a churn-y import sweep.
//!
//! File-system helpers (copy/import/folder) live in
//! `houston_engine_core::agents::files` and are exposed through the engine's
//! `/v1/agents/files/*` REST surface.

pub use houston_engine_core::agents::prompt::*;
