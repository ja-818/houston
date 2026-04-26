use super::session_io;
use super::types::{FeedItem, Provider, SessionStatus};
use crate::auth_error::is_auth_error;
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
        provider: Provider,
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

            match provider {
                Provider::Anthropic => {
                    spawn_claude(
                        &tx,
                        prompt,
                        resume_session_id,
                        working_dir,
                        model,
                        effort,
                        system_prompt,
                        mcp_config,
                        disable_builtin_tools,
                        disable_all_tools,
                    )
                    .await;
                }
                Provider::OpenAI => {
                    spawn_codex(
                        &tx,
                        prompt,
                        resume_session_id,
                        working_dir,
                        model,
                        system_prompt,
                    )
                    .await;
                }
            }
        });

        let session_handle = SessionHandle { _task: handle };
        (rx, session_handle)
    }
}

/// Spawn a Claude CLI session (`claude -p --output-format stream-json`).
async fn spawn_claude(
    tx: &mpsc::UnboundedSender<SessionUpdate>,
    prompt: String,
    resume_session_id: Option<String>,
    working_dir: Option<std::path::PathBuf>,
    model: Option<String>,
    effort: Option<String>,
    system_prompt: Option<String>,
    mcp_config: Option<std::path::PathBuf>,
    disable_builtin_tools: bool,
    disable_all_tools: bool,
) {
    tracing::info!(
        "[houston:session] spawning claude -p (resume={:?})",
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
        cmd.arg("--allowedTools").arg("");
    } else {
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

    run_cli_process(tx, &mut cmd, &prompt, Provider::Anthropic).await;
}

/// Spawn a Codex CLI session (`codex exec --json --dangerously-bypass-approvals-and-sandbox`).
async fn spawn_codex(
    tx: &mpsc::UnboundedSender<SessionUpdate>,
    prompt: String,
    resume_session_id: Option<String>,
    working_dir: Option<std::path::PathBuf>,
    model: Option<String>,
    system_prompt: Option<String>,
) {
    tracing::info!(
        "[houston:session] spawning codex exec --json (resume={:?})",
        resume_session_id
    );

    let mut cmd = Command::new("codex");
    cmd.env("PATH", super::claude_path::shell_path());

    let is_resume = resume_session_id.is_some();

    if let Some(ref session_id) = resume_session_id {
        cmd.arg("exec").arg("resume").arg(session_id);
    } else {
        cmd.arg("exec");
    }

    cmd.arg("--json")
        .arg("--dangerously-bypass-approvals-and-sandbox")
        .arg("--skip-git-repo-check");

    // Inject system prompt via developer_instructions config override.
    // Codex has no --system-prompt flag; this is the supported injection point.
    if let Some(ref sp) = system_prompt {
        let json_val = serde_json::to_string(sp).unwrap_or_else(|_| format!("\"{sp}\""));
        cmd.arg("-c")
            .arg(format!("developer_instructions={json_val}"));
    }

    if let Some(ref m) = model {
        cmd.arg("--model").arg(m);
    }

    if let Some(ref dir) = working_dir {
        if !dir.is_dir() {
            let _ = tx.send(SessionUpdate::Status(SessionStatus::Error(format!(
                "Working directory not found: {}. Was it deleted?",
                dir.display()
            ))));
            return;
        }
        // --cd is only valid for `codex exec`, not `codex exec resume`
        if is_resume {
            cmd.current_dir(dir);
        } else {
            cmd.arg("--cd").arg(dir);
        }
    }

    run_cli_process(tx, &mut cmd, &prompt, Provider::OpenAI).await;
}

/// Shared subprocess lifecycle: spawn, write prompt to stdin, read stdout/stderr, wait.
async fn run_cli_process(
    tx: &mpsc::UnboundedSender<SessionUpdate>,
    cmd: &mut Command,
    prompt: &str,
    provider: Provider,
) {
    let cli_name = match provider {
        Provider::Anthropic => "claude",
        Provider::OpenAI => "codex",
    };

    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::piped());
    cmd.stdin(Stdio::piped());

    let mut child = match cmd.spawn() {
        Ok(c) => c,
        Err(e) => {
            let _ = tx.send(SessionUpdate::Status(SessionStatus::Error(format!(
                "Failed to spawn {cli_name}: {e}"
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
    tracing::info!("[houston:session] {cli_name} process started, reading output");

    let stdout = child.stdout.take();
    let stderr = child.stderr.take();

    let mut io_set: JoinSet<Option<Vec<String>>> = JoinSet::new();

    if let Some(stderr) = stderr {
        let tx2 = tx.clone();
        io_set.spawn(async move { Some(session_io::read_stderr_lines(stderr, tx2).await) });
    }
    if let Some(stdout) = stdout {
        let tx2 = tx.clone();
        io_set.spawn(async move {
            session_io::read_stdout_events(stdout, tx2, provider).await;
            None
        });
    }

    let mut stderr_lines = Vec::new();
    while let Some(result) = io_set.join_next().await {
        match result {
            Ok(Some(lines)) => stderr_lines = lines,
            Ok(None) => {}
            Err(e) => {
                let msg = format!("I/O reader panicked: {e:?}");
                tracing::info!("[houston:session] {msg}");
                let _ = tx.send(SessionUpdate::Status(SessionStatus::Error(msg)));
                let _ = child.kill().await;
                return;
            }
        }
    }

    tracing::info!("[houston:session] stdout closed, waiting for process exit");
    match child.wait().await {
        Ok(status) => {
            tracing::info!("[houston:session] process exited with {status}");
            let is_sigterm = status.code() == Some(143);
            if status.success() || is_sigterm {
                let _ = tx.send(SessionUpdate::Status(SessionStatus::Completed));
            } else {
                // Check if stderr indicates an auth failure (e.g. Codex 401 retries).
                let has_auth_error = stderr_lines.iter().any(|l| is_auth_error(l));

                if has_auth_error {
                    // Clean error — no noisy stderr dump.
                    let _ = tx.send(SessionUpdate::Status(SessionStatus::Error(
                        "Authentication expired — sign in again to continue".to_string(),
                    )));
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
                        "{cli_name} exited with {status}"
                    ))));
                }
            }
        }
        Err(e) => {
            let _ = tx.send(SessionUpdate::Status(SessionStatus::Error(format!(
                "Failed to wait for {cli_name}: {e}"
            ))));
        }
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
