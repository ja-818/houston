use super::codex_parser;
use super::manager::SessionUpdate;
use super::parser;
use super::types::{FeedItem, Provider};
use crate::auth_error::{AUTH_RETRY_MARKER, is_auth_retry_noise};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::sync::mpsc;

/// Read all stderr lines, emitting each as a `SystemMessage` feed item.
/// Returns the collected lines so the caller can include them in error reports.
pub async fn read_stderr_lines(
    stderr: tokio::process::ChildStderr,
    tx: mpsc::UnboundedSender<SessionUpdate>,
) -> Vec<String> {
    let mut lines = Vec::new();
    let mut sent_auth_checking = false;
    let reader = BufReader::new(stderr);
    let mut reader_lines = reader.lines();
    while let Ok(Some(line)) = reader_lines.next_line().await {
        tracing::debug!("cli stderr: {line}");
        if is_auth_retry_noise(&line) {
            // Send one internal marker; session_runner owns user-visible copy
            // and AuthRequired emission.
            if !sent_auth_checking {
                sent_auth_checking = true;
                let _ = tx.send(SessionUpdate::Feed(FeedItem::SystemMessage(
                    AUTH_RETRY_MARKER.to_string(),
                )));
            }
        } else if is_meaningful_stderr(&line) {
            let _ = tx.send(SessionUpdate::Feed(FeedItem::SystemMessage(format!(
                "stderr: {line}",
            ))));
        }
        lines.push(line);
    }
    lines
}

/// Filter out stderr noise that shouldn't be shown to users.
fn is_meaningful_stderr(line: &str) -> bool {
    let trimmed = line.trim();
    if trimmed.is_empty() {
        return false;
    }
    // Codex progress noise
    if trimmed.starts_with("Reading prompt from stdin") {
        return false;
    }
    // Common non-error stderr patterns
    if trimmed.starts_with("Downloading") || trimmed.starts_with("Loading") {
        return false;
    }
    // Auth retry noise (e.g. "Error: Reconnecting... 1/5 (unexpected status 401 Unauthorized...)")
    // These are internal retries — the session runner handles the auth failure at exit.
    if is_auth_retry_noise(trimmed) {
        return false;
    }
    true
}

/// Read all stdout lines, parsing each as NDJSON and sending parsed feed items
/// (and session IDs) to the channel. Routes to the correct parser based on provider.
pub async fn read_stdout_events(
    stdout: tokio::process::ChildStdout,
    tx: mpsc::UnboundedSender<SessionUpdate>,
    provider: Provider,
) {
    match provider {
        Provider::Anthropic => read_claude_stdout(stdout, tx).await,
        Provider::OpenAI => read_codex_stdout(stdout, tx).await,
    }
}

async fn read_claude_stdout(
    stdout: tokio::process::ChildStdout,
    tx: mpsc::UnboundedSender<SessionUpdate>,
) {
    let reader = BufReader::new(stdout);
    let mut lines = reader.lines();
    let mut acc = parser::StreamAccumulator::new();
    let mut line_count = 0u64;
    let mut item_count = 0u64;
    while let Ok(Some(line)) = lines.next_line().await {
        line_count += 1;
        let line_type = line.trim().chars().take(80).collect::<String>();
        tracing::debug!("[houston:stdout:claude] line {line_count}: {line_type}");

        if let Some(sid) = parser::extract_session_id(&line) {
            let _ = tx.send(SessionUpdate::SessionId(sid));
        }
        let items = parser::parse_event(&line, &mut acc);
        item_count += log_and_send(&tx, items);
    }
    tracing::debug!(
        "[houston:stdout:claude] stream ended. {line_count} lines, {item_count} feed items"
    );
}

async fn read_codex_stdout(
    stdout: tokio::process::ChildStdout,
    tx: mpsc::UnboundedSender<SessionUpdate>,
) {
    let reader = BufReader::new(stdout);
    let mut lines = reader.lines();
    let mut acc = codex_parser::CodexAccumulator::new();
    let mut line_count = 0u64;
    let mut item_count = 0u64;
    while let Ok(Some(line)) = lines.next_line().await {
        line_count += 1;
        let line_type = line.trim().chars().take(80).collect::<String>();
        tracing::debug!("[houston:stdout:codex] line {line_count}: {line_type}");

        if let Some(tid) = codex_parser::extract_thread_id(&line) {
            let _ = tx.send(SessionUpdate::SessionId(tid));
        }
        let items = codex_parser::parse_codex_event(&line, &mut acc);
        item_count += log_and_send(&tx, items);
    }
    tracing::debug!(
        "[houston:stdout:codex] stream ended. {line_count} lines, {item_count} feed items"
    );
}

fn log_and_send(tx: &mpsc::UnboundedSender<SessionUpdate>, items: Vec<FeedItem>) -> u64 {
    let mut count = 0u64;
    for item in &items {
        count += 1;
        match item {
            FeedItem::AssistantTextStreaming(t) => {
                tracing::debug!(
                    "[houston:stdout] -> FeedItem::AssistantTextStreaming ({} chars)",
                    t.len()
                );
            }
            FeedItem::AssistantText(t) => {
                tracing::debug!(
                    "[houston:stdout] -> FeedItem::AssistantText ({} chars)",
                    t.len()
                );
            }
            other => {
                tracing::debug!(
                    "[houston:stdout] -> FeedItem::{:?}",
                    std::mem::discriminant(other)
                );
            }
        }
    }
    for item in items {
        let _ = tx.send(SessionUpdate::Feed(item));
    }
    count
}
