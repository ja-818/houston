//! Provider CLI auth probes shared by status routes and session error handling.

use crate::claude_path;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::time::Duration;

#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ProviderAuthState {
    Authenticated,
    Unauthenticated,
    Unknown,
}

impl ProviderAuthState {
    pub const fn is_authenticated(self) -> bool {
        matches!(self, Self::Authenticated)
    }
}

pub async fn probe_claude_auth_status(cli_path: &Path) -> ProviderAuthState {
    let result = tokio::time::timeout(
        Duration::from_secs(5),
        tokio::process::Command::new(cli_path)
            .args(["auth", "status"])
            .env("PATH", claude_path::shell_path())
            .kill_on_drop(true)
            .output(),
    )
    .await;

    let output = match result {
        Ok(Ok(output)) => output,
        _ => return ProviderAuthState::Unknown,
    };

    classify_claude_auth_status_output(
        output.status.success(),
        &String::from_utf8_lossy(&output.stdout),
        &String::from_utf8_lossy(&output.stderr),
    )
}

pub async fn probe_codex_auth_status(cli_path: &Path, home: &str) -> ProviderAuthState {
    match probe_codex_login_status(cli_path).await {
        ProviderAuthState::Authenticated => ProviderAuthState::Authenticated,
        ProviderAuthState::Unauthenticated => ProviderAuthState::Unauthenticated,
        ProviderAuthState::Unknown => read_codex_auth_file(home),
    }
}

async fn probe_codex_login_status(cli_path: &Path) -> ProviderAuthState {
    let result = tokio::time::timeout(
        Duration::from_secs(5),
        tokio::process::Command::new(cli_path)
            .args(["login", "status", "-c", "model_reasoning_effort=high"])
            .env("PATH", claude_path::shell_path())
            .kill_on_drop(true)
            .output(),
    )
    .await;

    let output = match result {
        Ok(Ok(output)) => output,
        _ => return ProviderAuthState::Unknown,
    };

    classify_codex_login_status_output(
        output.status.success(),
        &String::from_utf8_lossy(&output.stdout),
        &String::from_utf8_lossy(&output.stderr),
    )
}

fn classify_claude_auth_status_output(
    success: bool,
    stdout: &str,
    stderr: &str,
) -> ProviderAuthState {
    if let Ok(value) = serde_json::from_str::<serde_json::Value>(stdout.trim()) {
        if let Some(logged_in) = value.get("loggedIn").and_then(|v| v.as_bool()) {
            return if logged_in {
                ProviderAuthState::Authenticated
            } else {
                ProviderAuthState::Unauthenticated
            };
        }
    }

    let text = format!("{stdout}\n{stderr}").to_lowercase();
    if contains_unauthenticated_text(&text) {
        return ProviderAuthState::Unauthenticated;
    }
    if success && (text.contains("logged in") || text.contains("authenticated")) {
        return ProviderAuthState::Authenticated;
    }
    ProviderAuthState::Unknown
}

fn classify_codex_login_status_output(
    success: bool,
    stdout: &str,
    stderr: &str,
) -> ProviderAuthState {
    let text = format!("{stdout}\n{stderr}").to_lowercase();
    if contains_unauthenticated_text(&text)
        || text.contains("signed out")
        || text.contains("no auth credentials")
        || text.contains("run codex login")
    {
        return ProviderAuthState::Unauthenticated;
    }
    if success && (text.contains("logged in") || text.contains("authenticated")) {
        return ProviderAuthState::Authenticated;
    }
    ProviderAuthState::Unknown
}

fn contains_unauthenticated_text(text: &str) -> bool {
    text.contains("not logged in")
        || text.contains("not authenticated")
        || text.contains("please login")
        || text.contains("please log in")
}

fn read_codex_auth_file(home: &str) -> ProviderAuthState {
    let auth_path = PathBuf::from(home).join(".codex").join("auth.json");
    let content = match std::fs::read_to_string(&auth_path) {
        Ok(content) => content,
        Err(_) => return ProviderAuthState::Unauthenticated,
    };
    serde_json::from_str::<serde_json::Value>(&content)
        .ok()
        .map(|value| {
            let has_api_key = value
                .get("OPENAI_API_KEY")
                .and_then(|key| key.as_str())
                .is_some_and(|s| !s.is_empty());
            let has_tokens = value.get("tokens").is_some();
            if has_api_key || has_tokens {
                ProviderAuthState::Authenticated
            } else {
                ProviderAuthState::Unauthenticated
            }
        })
        .unwrap_or(ProviderAuthState::Unknown)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn claude_auth_status_classifies_json_logged_in() {
        let state = classify_claude_auth_status_output(true, r#"{"loggedIn":true}"#, "");
        assert_eq!(state, ProviderAuthState::Authenticated);
    }

    #[test]
    fn claude_auth_status_classifies_json_logged_out() {
        let state = classify_claude_auth_status_output(true, r#"{"loggedIn":false}"#, "");
        assert_eq!(state, ProviderAuthState::Unauthenticated);
    }

    #[test]
    fn claude_auth_status_keeps_opaque_failures_unknown() {
        let state = classify_claude_auth_status_output(false, "", "Error: Unknown error");
        assert_eq!(state, ProviderAuthState::Unknown);
    }

    #[test]
    fn codex_login_status_classifies_logged_in_output() {
        let state = classify_codex_login_status_output(true, "Logged in using ChatGPT", "");
        assert_eq!(state, ProviderAuthState::Authenticated);
    }

    #[test]
    fn codex_login_status_classifies_not_logged_in_output_first() {
        let state = classify_codex_login_status_output(true, "Not logged in", "");
        assert_eq!(state, ProviderAuthState::Unauthenticated);
    }

    #[test]
    fn codex_login_status_falls_back_on_config_errors() {
        let stderr = "Error loading configuration: unknown variant `xhigh`";
        let state = classify_codex_login_status_output(false, "", stderr);
        assert_eq!(state, ProviderAuthState::Unknown);
    }
}
