//! Activity summarizer — relocated from `app/src-tauri/src/commands/chat.rs`.
//!
//! Shells out to the user's configured provider CLI to generate a concise
//! `{title, description}` JSON object. Failures degrade to a deterministic
//! local title so conversation creation never depends on title generation.

use super::summary_text::{
    fallback_summary, normalize_spaces, parse_summary, truncate_chars, DESCRIPTION_MAX_CHARS,
};
use crate::error::CoreResult;
use houston_terminal_manager::{claude_path, Provider};
use serde_json::Value;
use std::time::Duration;
use tokio::io::AsyncWriteExt;
use tokio::process::Command;
use tokio::time::timeout;

const SUMMARY_TIMEOUT: Duration = Duration::from_secs(12);
const CLAUDE_TITLE_MODEL: &str = "haiku";
const CODEX_TITLE_MODEL: &str = "gpt-5.5-mini";

pub use super::summary_text::SummarizeResult;

pub async fn summarize(
    message: &str,
    provider: Provider,
    model: Option<&str>,
) -> CoreResult<SummarizeResult> {
    let fallback = fallback_summary(message);
    let raw = match run_provider_summary(message, provider, model).await {
        Ok(raw) => raw,
        Err(e) => {
            tracing::warn!(provider = %provider, error = %e, "title summary fallback");
            return Ok(fallback);
        }
    };

    match parse_summary(&raw, &fallback) {
        Ok(summary) => Ok(summary),
        Err(e) => {
            tracing::warn!(provider = %provider, error = %e, "title summary parse fallback");
            Ok(fallback)
        }
    }
}

fn title_prompt(message: &str) -> String {
    let prompt = format!(
        "Generate a concise title and description for this conversation.\n\
         Title: max 6 words. Description: one short sentence.\n\
         Return ONLY valid JSON, no markdown fences:\n\
         {{\"title\": \"...\", \"description\": \"...\"}}\n\n\
         Task: {message}"
    );
    prompt
}

async fn run_provider_summary(
    message: &str,
    provider: Provider,
    model: Option<&str>,
) -> Result<String, String> {
    let prompt = title_prompt(message);
    match provider {
        Provider::Anthropic => run_claude_summary(&prompt, model).await,
        Provider::OpenAI => run_codex_summary(&prompt, model).await,
    }
}

async fn run_claude_summary(prompt: &str, model: Option<&str>) -> Result<String, String> {
    let mut cmd = tokio::process::Command::new("claude");
    cmd.env("PATH", claude_path::shell_path());
    cmd.env_remove("CLAUDE_CODE_ENTRYPOINT");
    cmd.env_remove("CLAUDECODE");
    cmd.arg("-p")
        .arg("--model")
        .arg(model.unwrap_or(CLAUDE_TITLE_MODEL))
        .arg("--output-format")
        .arg("text")
        .arg("--allowedTools")
        .arg("");
    run_command_with_prompt(cmd, prompt).await
}

async fn run_codex_summary(prompt: &str, model: Option<&str>) -> Result<String, String> {
    // Prefer the bundled codex (pinned in `cli-deps.json`) so the title
    // summarizer can't get sabotaged by a stale `nvm`/`brew` codex on the
    // user's PATH that doesn't recognize the model we picked.
    let bin = houston_cli_bundle::bundled_codex_path()
        .unwrap_or_else(|| std::path::PathBuf::from("codex"));
    let mut cmd = tokio::process::Command::new(&bin);
    cmd.env("PATH", claude_path::shell_path());
    cmd.arg("exec")
        .arg("--json")
        .arg("--dangerously-bypass-approvals-and-sandbox")
        .arg("--skip-git-repo-check")
        // Override `model_reasoning_effort` so a stale global
        // `~/.codex/config.toml` (newer Codex CLIs allow `xhigh`, older ones
        // reject it) can't kill title generation. We don't need much thought
        // here — it's a 6-word title.
        .arg("-c")
        .arg("model_reasoning_effort=\"low\"")
        .arg("--model")
        .arg(model.unwrap_or(CODEX_TITLE_MODEL))
        .arg("-");
    let stdout = run_command_with_prompt(cmd, prompt).await?;
    extract_codex_text(&stdout)
}

async fn run_command_with_prompt(mut cmd: Command, prompt: &str) -> Result<String, String> {
    cmd.kill_on_drop(true);
    cmd.stdin(std::process::Stdio::piped());
    cmd.stdout(std::process::Stdio::piped());
    cmd.stderr(std::process::Stdio::piped());

    let mut child = cmd.spawn().map_err(|e| format!("spawn failed: {e}"))?;

    if let Some(mut stdin) = child.stdin.take() {
        stdin
            .write_all(prompt.as_bytes())
            .await
            .map_err(|e| format!("stdin write failed: {e}"))?;
        drop(stdin);
    }

    let output = match timeout(SUMMARY_TIMEOUT, child.wait_with_output()).await {
        Ok(Ok(output)) => output,
        Ok(Err(e)) => return Err(format!("process failed: {e}")),
        Err(_) => return Err("process timed out".to_string()),
    };

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let summary = truncate_chars(&normalize_spaces(&stderr), DESCRIPTION_MAX_CHARS);
        return Err(format!("process exited {}: {summary}", output.status));
    }

    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

fn extract_codex_text(stdout: &str) -> Result<String, String> {
    let mut latest = String::new();
    for line in stdout.lines() {
        let Ok(event) = serde_json::from_str::<Value>(line.trim()) else {
            continue;
        };
        let Some(item) = event.get("item") else {
            continue;
        };
        if item.get("type").and_then(Value::as_str) == Some("agent_message") {
            if let Some(text) = item.get("text").and_then(Value::as_str) {
                latest = text.to_string();
            }
        }
    }
    if latest.trim().is_empty() {
        Err("codex output had no agent_message text".to_string())
    } else {
        Ok(latest)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extracts_codex_agent_message_text() {
        let raw = r#"{"type":"thread.started","thread_id":"t1"}
{"type":"item.completed","item":{"type":"agent_message","text":"{\"title\":\"Fix upload error\",\"description\":\"Debug 413 uploads.\"}"}}"#;

        assert_eq!(
            extract_codex_text(raw).unwrap(),
            "{\"title\":\"Fix upload error\",\"description\":\"Debug 413 uploads.\"}"
        );
    }
}
