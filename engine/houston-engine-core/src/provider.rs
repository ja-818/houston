//! Provider management — relocated from `app/src-tauri/src/commands/provider.rs`.
//!
//! CLI-installation + auth-status probes and the OAuth login launcher.
//! Default-provider persistence reuses `crate::preferences` (generic
//! key/value store), so `DEFAULT_PROVIDER_KEY` is exposed for callers
//! that want to `get`/`set` the preference directly.

use crate::error::{CoreError, CoreResult};
use houston_terminal_manager::{claude_path, Provider};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::time::Duration;

pub const DEFAULT_PROVIDER_KEY: &str = "default_provider";

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ProviderStatus {
    pub provider: String,
    pub cli_installed: bool,
    pub authenticated: bool,
    pub cli_name: String,
}

/// Parse a provider name string, mapping errors onto `CoreError::BadRequest`.
pub fn parse(s: &str) -> CoreResult<Provider> {
    s.parse::<Provider>()
        .map_err(|e| CoreError::BadRequest(format!("invalid provider: {e}")))
}

pub async fn check_status(provider: Provider) -> CoreResult<ProviderStatus> {
    Ok(match provider {
        Provider::Anthropic => check_claude_status().await,
        Provider::OpenAI => check_codex_status().await,
    })
}

/// Launch the provider's login flow in the background (opens the user's
/// browser for OAuth). Returns immediately — the frontend polls
/// `check_status` to observe completion.
pub fn launch_login(provider: Provider) -> CoreResult<()> {
    let shell_path = claude_path::shell_path();

    let (cmd, args): (&str, Vec<&'static str>) = match provider {
        Provider::Anthropic => ("claude", vec!["auth", "login", "--claudeai"]),
        Provider::OpenAI => ("codex", vec!["login"]),
    };

    if !claude_path::is_command_available(cmd) {
        return Err(CoreError::BadRequest(format!("{cmd} CLI is not installed")));
    }

    tokio::spawn(async move {
        let result = tokio::time::timeout(
            Duration::from_secs(120),
            tokio::process::Command::new(cmd)
                .args(&args)
                .env("PATH", shell_path)
                .stdin(std::process::Stdio::null())
                .stdout(std::process::Stdio::null())
                .stderr(std::process::Stdio::null())
                .kill_on_drop(true)
                .status(),
        )
        .await;

        match result {
            Ok(Ok(status)) => tracing::info!("[houston:provider] {cmd} login exited: {status}"),
            Ok(Err(e)) => tracing::warn!("[houston:provider] {cmd} login failed: {e}"),
            Err(_) => tracing::warn!("[houston:provider] {cmd} login timed out after 120s"),
        }
    });

    Ok(())
}

async fn check_claude_status() -> ProviderStatus {
    let cli_installed = claude_path::is_command_available("claude");
    let authenticated = if cli_installed { check_claude_auth().await } else { false };
    ProviderStatus {
        provider: "anthropic".into(),
        cli_installed,
        authenticated,
        cli_name: "claude".into(),
    }
}

/// `claude --version` succeeds without auth; `claude auth status` returns
/// the real `loggedIn` signal as JSON.
async fn check_claude_auth() -> bool {
    let shell_path = claude_path::shell_path();
    let result = tokio::time::timeout(
        Duration::from_secs(5),
        tokio::process::Command::new("claude")
            .args(["auth", "status"])
            .env("PATH", &shell_path)
            .kill_on_drop(true)
            .output(),
    )
    .await;

    let output = match result {
        Ok(Ok(o)) if o.status.success() => o.stdout,
        _ => return false,
    };

    let text = String::from_utf8_lossy(&output);
    serde_json::from_str::<serde_json::Value>(text.trim())
        .ok()
        .and_then(|v| v.get("loggedIn")?.as_bool())
        .unwrap_or(false)
}

async fn check_codex_status() -> ProviderStatus {
    let cli_installed = claude_path::is_command_available("codex");
    let authenticated = if cli_installed {
        let home = std::env::var("HOME").unwrap_or_default();
        if check_codex_auth(&home) {
            ensure_codex_fallback_config(&home);
            true
        } else {
            false
        }
    } else {
        false
    };

    ProviderStatus {
        provider: "openai".into(),
        cli_installed,
        authenticated,
        cli_name: "codex".into(),
    }
}

fn check_codex_auth(home: &str) -> bool {
    let auth_path = PathBuf::from(home).join(".codex").join("auth.json");
    let content = match std::fs::read_to_string(&auth_path) {
        Ok(c) => c,
        Err(_) => return false,
    };
    serde_json::from_str::<serde_json::Value>(&content)
        .ok()
        .map(|v| {
            v.get("OPENAI_API_KEY")
                .and_then(|k| k.as_str())
                .is_some_and(|s| !s.is_empty())
                || v.get("tokens").is_some()
        })
        .unwrap_or(false)
}

/// Append `HOUSTON.md` to Codex's `project_doc_fallback_filenames` so it
/// auto-reads our agent doc like it does `AGENTS.md`.
fn ensure_codex_fallback_config(home: &str) {
    let config_path = PathBuf::from(home).join(".codex").join("config.toml");
    let content = std::fs::read_to_string(&config_path).unwrap_or_default();

    if content.contains("HOUSTON.md") {
        return;
    }

    let line = if content.contains("project_doc_fallback_filenames") {
        tracing::info!(
            "[houston:codex] project_doc_fallback_filenames exists but missing HOUSTON.md — \
             add it manually to ~/.codex/config.toml for full Houston integration"
        );
        return;
    } else {
        "\nproject_doc_fallback_filenames = [\"HOUSTON.md\"]\n"
    };

    if let Err(e) = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&config_path)
        .and_then(|mut f| std::io::Write::write_all(&mut f, line.as_bytes()))
    {
        tracing::warn!("[houston:codex] failed to update config.toml: {e}");
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_rejects_unknown() {
        assert!(parse("gemini").is_err());
        assert!(parse("anthropic").is_ok());
        assert!(parse("openai").is_ok());
    }
}
