use super::manager::SessionUpdate;
use super::parser;
use super::types::FeedItem;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::sync::mpsc;

/// Read all stderr lines, emitting each as a `SystemMessage` feed item.
/// Returns the collected lines so the caller can include them in error reports.
pub async fn read_stderr_lines(
    stderr: tokio::process::ChildStderr,
    tx: mpsc::UnboundedSender<SessionUpdate>,
) -> Vec<String> {
    let mut lines = Vec::new();
    let reader = BufReader::new(stderr);
    let mut reader_lines = reader.lines();
    while let Ok(Some(line)) = reader_lines.next_line().await {
        eprintln!("claude stderr: {line}");
        let _ = tx.send(SessionUpdate::Feed(FeedItem::SystemMessage(format!(
            "stderr: {line}",
        ))));
        lines.push(line);
    }
    lines
}

/// Read all stdout lines, parsing each as NDJSON and sending parsed feed items
/// (and session IDs) to the channel.
pub async fn read_stdout_events(
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
        // Log every NDJSON line type for debugging.
        let line_type = line.trim().chars().take(80).collect::<String>();
        eprintln!("[keel:stdout] line {line_count}: {line_type}");

        if let Some(sid) = parser::extract_session_id(&line) {
            let _ = tx.send(SessionUpdate::SessionId(sid));
        }
        let items = parser::parse_event(&line, &mut acc);
        for item in &items {
            item_count += 1;
            match item {
                FeedItem::AssistantTextStreaming(t) => {
                    eprintln!(
                        "[keel:stdout] -> FeedItem::AssistantTextStreaming ({} chars)",
                        t.len()
                    );
                }
                FeedItem::AssistantText(t) => {
                    eprintln!(
                        "[keel:stdout] -> FeedItem::AssistantText ({} chars)",
                        t.len()
                    );
                }
                other => {
                    eprintln!(
                        "[keel:stdout] -> FeedItem::{:?}",
                        std::mem::discriminant(other)
                    );
                }
            }
        }
        for item in items {
            let _ = tx.send(SessionUpdate::Feed(item));
        }
    }
    eprintln!(
        "[keel:stdout] stream ended. {line_count} lines, {item_count} feed items emitted"
    );
}
