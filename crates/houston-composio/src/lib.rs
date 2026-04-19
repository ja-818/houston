//! houston-composio — Composio integration for Houston.
//!
//! Wraps the `composio` CLI (`~/.composio/composio`) with install/upgrade
//! lifecycle, OAuth flow, app catalog, and Tauri commands consumed by the
//! frontend integrations tab.

pub mod apps;
pub mod auth;
pub mod cli;
pub mod commands;
pub mod install;
pub mod lifecycle;
pub mod mcp;
