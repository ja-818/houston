//! Activity summarizer — relocated from `app/src-tauri/src/commands/chat.rs`.
//!
//! Shells out to the user's local `claude` CLI with the Haiku model to
//! generate a concise `{title, description}` JSON object. Engine-side
//! callers use this for new-activity titling.

use crate::error::{CoreError, CoreResult};
use houston_terminal_manager::claude_path;
use serde::{Deserialize, Serialize};
use tokio::io::AsyncWriteExt;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "snake_case")]
pub struct SummarizeResult {
    pub title: String,
    pub description: String,
}

pub async fn summarize(message: &str) -> CoreResult<SummarizeResult> {
    let prompt = format!(
        "Generate a title and description for this task.\n\
         Title: max 6 words, concise. Description: 1 short sentence.\n\
         Return ONLY valid JSON, no markdown fences:\n\
         {{\"title\": \"...\", \"description\": \"...\"}}\n\n\
         Task: {message}"
    );

    let mut cmd = tokio::process::Command::new("claude");
    cmd.env("PATH", claude_path::shell_path());
    cmd.env_remove("CLAUDE_CODE_ENTRYPOINT");
    cmd.env_remove("CLAUDECODE");
    cmd.arg("-p")
        .arg("--model")
        .arg("haiku")
        .arg("--output-format")
        .arg("text")
        .arg("--allowedTools")
        .arg("");
    cmd.stdin(std::process::Stdio::piped());
    cmd.stdout(std::process::Stdio::piped());
    cmd.stderr(std::process::Stdio::null());

    let mut child = cmd
        .spawn()
        .map_err(|e| CoreError::Internal(format!("Failed to spawn claude: {e}")))?;

    if let Some(mut stdin) = child.stdin.take() {
        stdin
            .write_all(prompt.as_bytes())
            .await
            .map_err(|e| CoreError::Internal(format!("Failed to write prompt: {e}")))?;
        drop(stdin);
    }

    let output = child
        .wait_with_output()
        .await
        .map_err(|e| CoreError::Internal(format!("Claude process failed: {e}")))?;

    let raw = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let json_str = raw
        .trim_start_matches("```json")
        .trim_start_matches("```")
        .trim_end_matches("```")
        .trim();

    serde_json::from_str(json_str)
        .map_err(|e| CoreError::Internal(format!("Failed to parse response: {e}\nRaw: {raw}")))
}
