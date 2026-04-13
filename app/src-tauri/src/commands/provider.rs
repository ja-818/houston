//! Tauri commands for AI provider management.

use houston_tauri::houston_sessions::Provider;
use houston_tauri::state::AppState;
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
    // Validate the provider string
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
    let shell_path = houston_tauri::houston_sessions::claude_path::shell_path();

    // Check if claude CLI exists
    let cli_installed = tokio::process::Command::new("which")
        .arg("claude")
        .env("PATH", &shell_path)
        .output()
        .await
        .map(|o| o.status.success())
        .unwrap_or(false);

    // Check auth by running `claude --version` (succeeds if configured)
    let authenticated = if cli_installed {
        tokio::process::Command::new("claude")
            .arg("--version")
            .env("PATH", &shell_path)
            .output()
            .await
            .map(|o| o.status.success())
            .unwrap_or(false)
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

async fn check_codex_status() -> Result<ProviderStatus, String> {
    let shell_path = houston_tauri::houston_sessions::claude_path::shell_path();

    // Check if codex CLI exists
    let cli_installed = tokio::process::Command::new("which")
        .arg("codex")
        .env("PATH", &shell_path)
        .output()
        .await
        .map(|o| o.status.success())
        .unwrap_or(false);

    // Check auth by looking for ~/.codex/auth.json
    let authenticated = if cli_installed {
        let home = std::env::var("HOME").unwrap_or_default();
        let auth_path = std::path::PathBuf::from(&home).join(".codex").join("auth.json");
        auth_path.exists()
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
