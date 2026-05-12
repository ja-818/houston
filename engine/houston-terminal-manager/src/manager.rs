use super::types::{Provider, SessionStatus};
use crate::claude_runner::spawn_claude;
use crate::cli_process::{run_cli_process, CliRunOutcome};
use crate::codex_command;
use crate::session_update::SessionUpdate;
use tokio::process::Command;
use tokio::sync::mpsc;

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
                        effort,
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

/// Default `model_reasoning_effort` used for Codex when the caller doesn't pass
/// one explicitly. Always emitted as `-c model_reasoning_effort="<value>"` so
/// the user's global `~/.codex/config.toml` can never break a Codex session.
/// Newer Codex CLIs allow values (e.g. `xhigh`) that the bundled CLI rejects;
/// forcing an override on every spawn keeps Houston resilient regardless of
/// what the user has installed locally.
const DEFAULT_CODEX_REASONING_EFFORT: &str = "medium";

/// Spawn a Codex CLI session (`codex exec --json --dangerously-bypass-approvals-and-sandbox`).
async fn spawn_codex(
    tx: &mpsc::UnboundedSender<SessionUpdate>,
    prompt: String,
    resume_session_id: Option<String>,
    working_dir: Option<std::path::PathBuf>,
    model: Option<String>,
    effort: Option<String>,
    system_prompt: Option<String>,
) {
    let effort = Some(
        effort.unwrap_or_else(|| DEFAULT_CODEX_REASONING_EFFORT.to_string()),
    );
    tracing::info!(
        "[houston:session] spawning codex exec --json (resume={:?}, model={:?}, effort={:?})",
        resume_session_id,
        model,
        effort,
    );

    if let Some(ref dir) = working_dir {
        if !dir.is_dir() {
            let _ = tx.send(SessionUpdate::Status(SessionStatus::Error(format!(
                "Working directory not found: {}. Was it deleted?",
                dir.display()
            ))));
            return;
        }
    }

    let mut cmd = build_codex_command(
        resume_session_id.as_deref(),
        working_dir.as_deref(),
        model.as_deref(),
        effort.as_deref(),
        system_prompt.as_deref(),
    );

    let outcome = run_cli_process(tx, &mut cmd, &prompt, Provider::OpenAI).await;
    if outcome == CliRunOutcome::CodexResumeMissing && resume_session_id.is_some() {
        tracing::warn!(
            "[houston:session] codex resume rollout missing; retrying with fresh thread"
        );
        let _ = tx.send(SessionUpdate::ResumeInvalid);
        let mut fresh_cmd = build_codex_command(
            None,
            working_dir.as_deref(),
            model.as_deref(),
            effort.as_deref(),
            system_prompt.as_deref(),
        );
        run_cli_process(tx, &mut fresh_cmd, &prompt, Provider::OpenAI).await;
    }
}

fn build_codex_command(
    resume_session_id: Option<&str>,
    working_dir: Option<&std::path::Path>,
    model: Option<&str>,
    effort: Option<&str>,
    system_prompt: Option<&str>,
) -> Command {
    // Always prefer the bundled codex over whatever happens to be on the
    // user's PATH. The user's PATH might point at a stale `nvm` codex that
    // doesn't know about the model we just selected (this exact case is
    // what initially shipped to users as "the conversation disappeared":
    // PATH's codex was old enough to reject `gpt-5.5`, while the bundled
    // CLI was current). Fall back to "codex" only when nothing is bundled,
    // which in practice means a misconfigured dev checkout — and in that
    // case the user gets the same behavior they had before.
    let bin = houston_cli_bundle::bundled_codex_path()
        .unwrap_or_else(|| std::path::PathBuf::from("codex"));
    let mut cmd = Command::new(&bin);
    cmd.env("PATH", super::claude_path::shell_path());
    cmd.args(codex_command::build_args(
        resume_session_id,
        working_dir,
        model,
        effort,
        system_prompt,
    ));
    if let Some(dir) = working_dir {
        cmd.current_dir(dir);
    }
    cmd
}
