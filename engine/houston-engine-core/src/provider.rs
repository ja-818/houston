//! Provider management — relocated from `app/src-tauri/src/commands/provider.rs`.
//!
//! CLI-installation + auth-status probes and the OAuth login launcher.
//! Default-provider persistence reuses `crate::preferences` (generic
//! key/value store), so `DEFAULT_PROVIDER_KEY` is exposed for callers
//! that want to `get`/`set` the preference directly.

use crate::error::{CoreError, CoreResult};
use houston_terminal_manager::provider_auth::{
    probe_claude_auth_status, probe_codex_auth_status, ProviderAuthState,
};
use houston_terminal_manager::{claude_path, Provider};
use serde::{Deserialize, Serialize};
use std::ffi::OsString;
use std::path::PathBuf;
use std::time::Duration;

mod resolve;
use resolve::{resolve_claude, resolve_codex};

pub const DEFAULT_PROVIDER_KEY: &str = "default_provider";

/// Where the resolved CLI binary came from. Surfaced to the UI so users
/// understand which version of `claude` / `codex` is in play (matches
/// the "bundled by Houston vs. your existing install" UX clarification
/// users have asked for).
#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum InstallSource {
    /// Shipped inside the Houston `.app` (`Contents/Resources/bin/`).
    /// Codex falls in this bucket on production builds; composio too;
    /// claude-code never (proprietary license).
    Bundled,
    /// Downloaded by Houston at runtime to a Houston-managed location
    /// (`~/.local/bin/claude` etc.). Claude-code falls in this bucket
    /// after the first-launch installer completes.
    Managed,
    /// Found on the user's PATH outside Houston's control (homebrew,
    /// npm, manual install, …). Houston uses it as-is.
    Path,
    /// Not installed anywhere Houston knows about.
    Missing,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ProviderStatus {
    pub provider: String,
    pub cli_installed: bool,
    pub auth_state: ProviderAuthState,
    pub cli_name: String,
    /// Where Houston found the CLI binary. Used for UI labelling.
    pub install_source: InstallSource,
    /// Absolute path to the binary that will be spawned. `None` when
    /// `install_source == Missing`.
    pub cli_path: Option<String>,
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
    let command = login_command(provider)?;

    tokio::spawn(async move {
        let LoginCommand {
            cli_name,
            path,
            args,
            shell_path,
        } = command;
        let result = tokio::time::timeout(
            Duration::from_secs(120),
            tokio::process::Command::new(&path)
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
                tracing::info!("[houston:provider] {cli_name} login exited: {status}")
            }
            Ok(Err(e)) => tracing::warn!(
                "[houston:provider] {cli_name} login failed at {}: {e}",
                path.display()
            ),
            Err(_) => tracing::warn!("[houston:provider] {cli_name} login timed out after 120s"),
        }
    });

    Ok(())
}

struct LoginCommand {
    cli_name: &'static str,
    path: PathBuf,
    args: Vec<&'static str>,
    shell_path: OsString,
}

fn login_command(provider: Provider) -> CoreResult<LoginCommand> {
    let resolved_path = match provider {
        Provider::Anthropic => resolve_claude().1,
        Provider::OpenAI => resolve_codex().1,
    };
    build_login_command(provider, resolved_path, claude_path::shell_path())
}

fn build_login_command(
    provider: Provider,
    resolved_path: Option<PathBuf>,
    shell_path: OsString,
) -> CoreResult<LoginCommand> {
    let (cli_name, args): (&'static str, Vec<&'static str>) = match provider {
        Provider::Anthropic => ("claude", vec!["auth", "login", "--claudeai"]),
        Provider::OpenAI => ("codex", vec!["login"]),
    };

    let path = resolved_path
        .ok_or_else(|| CoreError::BadRequest(format!("{cli_name} CLI is not installed")))?;

    Ok(LoginCommand {
        cli_name,
        path,
        args,
        shell_path,
    })
}

async fn check_claude_status() -> ProviderStatus {
    let (install_source, cli_path) = resolve_claude();
    let cli_installed = !matches!(install_source, InstallSource::Missing);
    let auth_state = if let Some(path) = cli_path.as_deref() {
        probe_claude_auth_status(path).await
    } else {
        ProviderAuthState::Unauthenticated
    };
    ProviderStatus {
        provider: "anthropic".into(),
        cli_installed,
        auth_state,
        cli_name: "claude".into(),
        install_source,
        cli_path: cli_path.map(|p| p.to_string_lossy().into_owned()),
    }
}

async fn check_codex_status() -> ProviderStatus {
    let (install_source, cli_path) = resolve_codex();
    let cli_installed = !matches!(install_source, InstallSource::Missing);
    let auth_state = if let Some(path) = cli_path.as_deref() {
        let home = std::env::var("HOME").unwrap_or_default();
        probe_codex_auth_status(path, &home).await
    } else {
        ProviderAuthState::Unauthenticated
    };

    ProviderStatus {
        provider: "openai".into(),
        cli_installed,
        auth_state,
        cli_name: "codex".into(),
        install_source,
        cli_path: cli_path.map(|p| p.to_string_lossy().into_owned()),
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

    #[test]
    fn install_source_serializes_lowercase() {
        let s = serde_json::to_string(&InstallSource::Bundled).unwrap();
        assert_eq!(s, "\"bundled\"");
        let s = serde_json::to_string(&InstallSource::Managed).unwrap();
        assert_eq!(s, "\"managed\"");
        let s = serde_json::to_string(&InstallSource::Path).unwrap();
        assert_eq!(s, "\"path\"");
        let s = serde_json::to_string(&InstallSource::Missing).unwrap();
        assert_eq!(s, "\"missing\"");
    }

    #[test]
    fn login_command_uses_resolved_cli_path() {
        let path = PathBuf::from("/tmp/houston-test-claude");
        let command = build_login_command(
            Provider::Anthropic,
            Some(path.clone()),
            OsString::from("/not/on/path"),
        )
        .unwrap();
        assert_eq!(command.cli_name, "claude");
        assert_eq!(command.path, path);
        assert_eq!(command.args, vec!["auth", "login", "--claudeai"]);
    }
}
