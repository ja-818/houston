//! Tauri commands for AI provider management.

use houston_tauri::houston_terminal_manager::claude_path;
use houston_tauri::houston_terminal_manager::Provider;
use houston_tauri::state::AppState;
use std::time::Duration;
use tauri::State;

#[derive(serde::Serialize)]
pub struct ProviderStatus {
    pub provider: String,
    pub cli_installed: bool,
    pub authenticated: bool,
    pub cli_name: String,
}

/// Check the status of a specific provider (is CLI installed? is user authenticated?).
#[tauri::command(rename_all = "snake_case")]
pub async fn check_provider_status(provider: String) -> Result<ProviderStatus, String> {
    let p: Provider = provider
        .parse()
        .map_err(|e: String| format!("Invalid provider: {e}"))?;

    match p {
        Provider::Anthropic => check_claude_status().await,
        Provider::OpenAI => check_codex_status().await,
    }
}

/// Get the global default provider preference.
/// Returns empty string if never configured (user must go through onboarding).
#[tauri::command(rename_all = "snake_case")]
pub async fn get_default_provider(
    state: State<'_, AppState>,
) -> Result<String, String> {
    let pref = state
        .db
        .get_preference("default_provider")
        .await
        .map_err(|e| e.to_string())?;
    Ok(pref.unwrap_or_default())
}

/// Set the global default provider preference.
#[tauri::command(rename_all = "snake_case")]
pub async fn set_default_provider(
    state: State<'_, AppState>,
    provider: String,
) -> Result<(), String> {
    let _: Provider = provider
        .parse()
        .map_err(|e: String| format!("Invalid provider: {e}"))?;
    state
        .db
        .set_preference("default_provider", &provider)
        .await
        .map_err(|e| e.to_string())
}

async fn check_claude_status() -> Result<ProviderStatus, String> {
    let cli_installed = claude_path::is_command_available("claude");

    let authenticated = if cli_installed {
        check_claude_auth().await
    } else {
        false
    };

    Ok(ProviderStatus {
        provider: "anthropic".into(),
        cli_installed,
        authenticated,
        cli_name: "claude".into(),
    })
}

/// Run `claude auth status` and parse the JSON `loggedIn` field.
/// `claude --version` succeeds even without auth — this is the real check.
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

async fn check_codex_status() -> Result<ProviderStatus, String> {
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

    Ok(ProviderStatus {
        provider: "openai".into(),
        cli_installed,
        authenticated,
        cli_name: "codex".into(),
    })
}

/// Validate that ~/.codex/auth.json exists and contains actual credentials.
fn check_codex_auth(home: &str) -> bool {
    let auth_path = std::path::PathBuf::from(home)
        .join(".codex")
        .join("auth.json");

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

/// Ensure `~/.codex/config.toml` includes `HOUSTON.md` in `project_doc_fallback_filenames`
/// so Codex auto-reads it like AGENTS.md.
fn ensure_codex_fallback_config(home: &str) {
    let config_path = std::path::PathBuf::from(home)
        .join(".codex")
        .join("config.toml");
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

/// Launch the provider's login flow — opens the user's browser for OAuth.
/// Spawns the login command in the background and returns immediately.
/// The frontend's auto-polling detects when auth completes.
#[tauri::command(rename_all = "snake_case")]
pub async fn launch_provider_login(provider: String) -> Result<(), String> {
    let p: Provider = provider
        .parse()
        .map_err(|e: String| format!("Invalid provider: {e}"))?;

    let shell_path = claude_path::shell_path();

    let (cmd, args): (&str, Vec<&str>) = match p {
        Provider::Anthropic => ("claude", vec!["auth", "login", "--claudeai"]),
        Provider::OpenAI => ("codex", vec!["login"]),
    };

    if !claude_path::is_command_available(cmd) {
        return Err(format!("{cmd} CLI is not installed"));
    }

    // Spawn the login process in background — it opens the browser and waits
    // for the OAuth callback. We don't block the frontend on this.
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
            Ok(Ok(status)) => {
                tracing::info!("[houston:provider] {cmd} login exited: {status}");
            }
            Ok(Err(e)) => {
                tracing::warn!("[houston:provider] {cmd} login failed: {e}");
            }
            Err(_) => {
                tracing::warn!("[houston:provider] {cmd} login timed out after 120s");
            }
        }
    });

    Ok(())
}

