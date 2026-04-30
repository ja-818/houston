use super::codex_parser;
use super::parser;
use super::stderr_filter::{stderr_feed_item, StderrState};
use super::types::{FeedItem, Provider};
use crate::provider_error::is_malformed_provider_json_error;
use crate::session_update::SessionUpdate;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::sync::mpsc;

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct StdoutReadReport {
    pub malformed_provider_json: bool,
}

/// Read all stderr lines, emitting only user-actionable feed items.
/// Returns the collected lines so the caller can include them in error reports.
pub async fn read_stderr_lines(
    stderr: tokio::process::ChildStderr,
    tx: mpsc::UnboundedSender<SessionUpdate>,
) -> Vec<String> {
    let mut lines = Vec::new();
    let mut state = StderrState::default();
    let reader = BufReader::new(stderr);
    let mut reader_lines = reader.lines();
    while let Ok(Some(line)) = reader_lines.next_line().await {
        tracing::debug!("cli stderr: {line}");
        if let Some(item) = stderr_feed_item(&line, &mut state) {
            if tx.send(SessionUpdate::Feed(item)).is_err() {
                break;
            }
        }
        lines.push(line);
    }
    lines
}

/// Read all stdout lines, parsing each as NDJSON and sending parsed feed items
/// (and session IDs) to the channel. Routes to the correct parser based on provider.
pub async fn read_stdout_events(
    stdout: tokio::process::ChildStdout,
    tx: mpsc::UnboundedSender<SessionUpdate>,
    provider: Provider,
) -> StdoutReadReport {
    match provider {
        Provider::Anthropic => read_claude_stdout(stdout, tx).await,
        Provider::OpenAI => {
            read_codex_stdout(stdout, tx).await;
            StdoutReadReport::default()
        }
    }
}

async fn read_claude_stdout(
    stdout: tokio::process::ChildStdout,
    tx: mpsc::UnboundedSender<SessionUpdate>,
) -> StdoutReadReport {
    let reader = BufReader::new(stdout);
    let mut lines = reader.lines();
    let mut acc = parser::StreamAccumulator::new();
    let mut line_count = 0u64;
    let mut item_count = 0u64;
    let mut report = StdoutReadReport::default();
    while let Ok(Some(line)) = lines.next_line().await {
        line_count += 1;
        let line_type = line.trim().chars().take(80).collect::<String>();
        tracing::debug!("[houston:stdout:claude] line {line_count}: {line_type}");

        if let Some(sid) = parser::extract_session_id(&line) {
            let _ = tx.send(SessionUpdate::SessionId(sid));
        }
        if is_malformed_provider_json_error(&line) {
            report.malformed_provider_json = true;
            tracing::warn!("[houston:stdout:claude] suppressed malformed provider JSON error");
            continue;
        }
        let items = parser::parse_event(&line, &mut acc);
        item_count += log_and_send(&tx, items);
    }
    tracing::debug!(
        "[houston:stdout:claude] stream ended. {line_count} lines, {item_count} feed items"
    );
    report
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
