use super::session_io;
use super::types::{FeedItem, SessionStatus};
use std::process::Stdio;
use tokio::io::AsyncWriteExt;
use tokio::process::Command;
use tokio::sync::mpsc;
use tokio::task::JoinSet;

/// Handle to a running session — keeps the task alive via its JoinHandle.
pub struct SessionHandle {
    _task: tokio::task::JoinHandle<()>,
}

/// Spawns a Claude/Codex session and streams parsed events back.
pub struct SessionManager;

impl SessionManager {
    /// Start a new CLI session with the given prompt.
    ///
    /// Returns a receiver of session updates and a handle that keeps the task alive.
    /// All sessions use --dangerously-skip-permissions because they're automated.
    /// Safety is controlled via system prompts and --disallowedTools / --tools flags.
    pub fn spawn_session(
        prompt: String,
        resume_session_id: Option<String>,
        working_dir: Option<std::path::PathBuf>,
        model: Option<String>,
        effort: Option<String>,
        system_prompt: Option<String>,
        mcp_config: Option<std::path::PathBuf>,
        disable_builtin_tools: bool,
        // When true, disables ALL tools (--allowedTools ""). Use for pure conversation.
        disable_all_tools: bool,
    ) -> (mpsc::UnboundedReceiver<SessionUpdate>, SessionHandle) {
        let (tx, rx) = mpsc::unbounded_channel();

        let handle = tokio::spawn(async move {
            let _ = tx.send(SessionUpdate::Status(SessionStatus::Starting));
            eprintln!(
                "[keel:session] spawning claude -p (resume={:?})",
                resume_session_id
            );

            let mut cmd = Command::new("claude");
            cmd.env("PATH", super::claude_path::shell_path());
            cmd.arg("-p")
                .arg("--output-format")
                .arg("stream-json")
                .arg("--verbose")
                .arg("--include-partial-messages");

            if disable_all_tools {
                // Pure conversation mode: no tools, no permissions bypass.
                cmd.arg("--allowedTools").arg("");
            } else {
                // Only grant full permissions when tools are enabled.
                cmd.arg("--dangerously-skip-permissions");
                if disable_builtin_tools {
                    cmd.arg("--disallowedTools")
                        .arg("Edit")
                        .arg("Write")
                        .arg("NotebookEdit");
                }
            }

            if let Some(ref m) = model {
                cmd.arg("--model").arg(m);
            }
            if let Some(ref e) = effort {
                cmd.arg("--effort").arg(e);
            }
            if let Some(ref sp) = system_prompt {
                cmd.arg("--system-prompt").arg(sp);
            }
            if let Some(ref mcp) = mcp_config {
                cmd.arg("--mcp-config").arg(mcp);
            }
            if let Some(ref session_id) = resume_session_id {
                cmd.arg("--resume").arg(session_id);
            }

            // Prevent nested Claude Code session detection.
            cmd.env_remove("CLAUDE_CODE_ENTRYPOINT");
            cmd.env_remove("CLAUDECODE");

            if let Some(ref dir) = working_dir {
                if !dir.is_dir() {
                    let _ = tx.send(SessionUpdate::Status(SessionStatus::Error(format!(
                        "Working directory not found: {}. Was it deleted?",
                        dir.display()
                    ))));
                    return;
                }
                cmd.current_dir(dir);
            }

            cmd.stdout(Stdio::piped());
            cmd.stderr(Stdio::piped());
            cmd.stdin(Stdio::piped());

            let mut child = match cmd.spawn() {
                Ok(c) => c,
                Err(e) => {
                    let _ = tx.send(SessionUpdate::Status(SessionStatus::Error(format!(
                        "Failed to spawn claude: {e}"
                    ))));
                    return;
                }
            };

            if let Some(mut stdin) = child.stdin.take() {
                if let Err(e) = stdin.write_all(prompt.as_bytes()).await {
                    let _ = tx.send(SessionUpdate::Status(SessionStatus::Error(format!(
                        "Failed to write prompt to stdin: {e}"
                    ))));
                    return;
                }
                drop(stdin);
            }

            if let Some(pid) = child.id() {
                let _ = tx.send(SessionUpdate::ProcessPid(pid));
            }
            let _ = tx.send(SessionUpdate::Status(SessionStatus::Running));
            eprintln!("[keel:session] claude process started, reading output");

            let stdout = child.stdout.take();
            let stderr = child.stderr.take();

            // Spawn stdout and stderr readers into a supervised JoinSet.
            // `Option<Vec<String>>` is Some for stderr (collected lines) and None for stdout.
            let mut io_set: JoinSet<Option<Vec<String>>> = JoinSet::new();

            if let Some(stderr) = stderr {
                let tx2 = tx.clone();
                io_set.spawn(async move {
                    Some(session_io::read_stderr_lines(stderr, tx2).await)
                });
            }
            if let Some(stdout) = stdout {
                let tx2 = tx.clone();
                io_set.spawn(async move {
                    session_io::read_stdout_events(stdout, tx2).await;
                    None
                });
            }

            // Drive I/O tasks; catch panics before they can corrupt shared state.
            let mut stderr_lines = Vec::new();
            while let Some(result) = io_set.join_next().await {
                match result {
                    Ok(Some(lines)) => stderr_lines = lines,
                    Ok(None) => {}
                    Err(e) => {
                        let msg = format!("I/O reader panicked: {e:?}");
                        eprintln!("[keel:session] {msg}");
                        let _ = tx.send(SessionUpdate::Status(SessionStatus::Error(msg)));
                        let _ = child.kill().await;
                        return;
                    }
                }
            }

            eprintln!("[keel:session] stdout closed, waiting for process exit");
            match child.wait().await {
                Ok(status) => {
                    eprintln!("[keel:session] process exited with {status}");
                    if status.success() {
                        let _ = tx.send(SessionUpdate::Status(SessionStatus::Completed));
                    } else {
                        let stderr_summary = if stderr_lines.is_empty() {
                            "no stderr output captured".to_string()
                        } else {
                            stderr_lines.join("\n")
                        };
                        let _ = tx.send(SessionUpdate::Feed(FeedItem::ToolResult {
                            content: format!("Process stderr:\n{stderr_summary}"),
                            is_error: true,
                        }));
                        let _ = tx.send(SessionUpdate::Status(SessionStatus::Error(format!(
                            "claude exited with {status}"
                        ))));
                    }
                }
                Err(e) => {
                    let _ = tx.send(SessionUpdate::Status(SessionStatus::Error(format!(
                        "Failed to wait for claude: {e}"
                    ))));
                }
            }
        });

        let session_handle = SessionHandle { _task: handle };
        (rx, session_handle)
    }
}

/// Updates sent from the session manager to consumers (monitors, pumps).
#[derive(Debug, Clone)]
pub enum SessionUpdate {
    Status(SessionStatus),
    SessionId(String),
    Feed(FeedItem),
    ProcessPid(u32),
}
