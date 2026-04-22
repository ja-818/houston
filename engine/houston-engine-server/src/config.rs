//! Server configuration — loaded from env vars, overridable on the CLI.

use rand::{distributions::Alphanumeric, Rng};
use std::net::SocketAddr;
use std::path::PathBuf;

/// Resolved server configuration.
#[derive(Debug, Clone)]
pub struct ServerConfig {
    /// Address to bind. Default `127.0.0.1:0` (random local port).
    pub bind: SocketAddr,
    /// Bearer token clients must send. Auto-generated if `HOUSTON_ENGINE_TOKEN` unset.
    pub token: String,
    /// Houston home directory (`~/.houston` by default). Holds `engine.json`.
    pub home_dir: PathBuf,
    /// Houston docs directory (`~/Documents/Houston` by default).
    pub docs_dir: PathBuf,
    /// Product-layer system prompt supplied by the app via
    /// `HOUSTON_APP_SYSTEM_PROMPT`. Engine prepends to every session when the
    /// caller doesn't supply its own `system_prompt`. Empty if unset — engine
    /// then produces agent-context only.
    pub app_system_prompt: String,
    /// Product-layer onboarding prompt supplied by the app via
    /// `HOUSTON_APP_ONBOARDING_PROMPT`. Appended on first-run sessions.
    pub app_onboarding_prompt: String,
}

impl ServerConfig {
    pub fn from_env() -> Self {
        let bind: SocketAddr = std::env::var("HOUSTON_BIND")
            .ok()
            .and_then(|s| s.parse().ok())
            .unwrap_or_else(|| "127.0.0.1:0".parse().unwrap());

        if bind.ip().is_unspecified() && std::env::var("HOUSTON_BIND_ALL").ok().as_deref() != Some("1") {
            panic!("Refusing to bind 0.0.0.0 without HOUSTON_BIND_ALL=1");
        }

        let token = std::env::var("HOUSTON_ENGINE_TOKEN").unwrap_or_else(|_| gen_token());

        // Debug vs release paths:
        //   release → `~/.houston/` (home) + `~/Documents/Houston/` (docs,
        //             where real users already have their workspaces).
        //   debug   → EVERYTHING under `~/.dev-houston/` so a dev run never
        //             touches a real user's install.
        // Env vars still win.
        let home_dir = std::env::var("HOUSTON_HOME")
            .map(PathBuf::from)
            .unwrap_or_else(|_| {
                dirs_home()
                    .map(|h| {
                        h.join(if cfg!(debug_assertions) {
                            ".dev-houston"
                        } else {
                            ".houston"
                        })
                    })
                    .expect("no home directory")
            });

        let docs_dir = std::env::var("HOUSTON_DOCS")
            .map(PathBuf::from)
            .unwrap_or_else(|_| {
                if cfg!(debug_assertions) {
                    // Dev: workspaces live INSIDE `~/.dev-houston/workspaces/`.
                    dirs_home()
                        .map(|h| h.join(".dev-houston").join("workspaces"))
                        .expect("no home directory")
                } else {
                    // Release: preserve legacy `~/Documents/Houston/`.
                    dirs_home()
                        .map(|h| h.join("Documents").join("Houston"))
                        .expect("no home directory")
                }
            });

        let app_system_prompt = std::env::var("HOUSTON_APP_SYSTEM_PROMPT").unwrap_or_default();
        let app_onboarding_prompt =
            std::env::var("HOUSTON_APP_ONBOARDING_PROMPT").unwrap_or_default();

        Self {
            bind,
            token,
            home_dir,
            docs_dir,
            app_system_prompt,
            app_onboarding_prompt,
        }
    }
}

fn gen_token() -> String {
    rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(48)
        .map(char::from)
        .collect()
}

fn dirs_home() -> Option<PathBuf> {
    std::env::var_os("HOME").map(PathBuf::from)
}
