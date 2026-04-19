use crate::agent;
use houston_tauri::session_id_tracker::SessionIdTracker;
use houston_tauri::agent_store::AgentStore;
use houston_tauri::events::HoustonEvent;
use houston_tauri::houston_sessions;
use houston_tauri::houston_sessions::Provider;
use houston_tauri::paths::expand_tilde;
use houston_tauri::session_pids::SessionPidMap;
use houston_tauri::session_runner::PersistOptions;
use houston_tauri::state::AppState;
use std::path::PathBuf;
use tauri::{Emitter, State};
use tokio::io::AsyncWriteExt;

/// Resolved provider + model for a session.
struct ResolvedProvider {
    provider: Provider,
    model: Option<String>,
}

/// Resolve the AI provider and model for an agent.
/// Priority: agent config → workspace → defaults.
fn resolve_provider(agent_dir: &std::path::Path) -> ResolvedProvider {
    // 1. Check agent-level config
    if let Ok(config) = AgentStore::new(agent_dir).read_config() {
        if let Some(ref p) = config.provider {
            if let Ok(provider) = p.parse::<Provider>() {
                return ResolvedProvider {
                    provider,
                    model: config.model.clone(),
                };
            }
        }
        // Agent has a model override but no provider — still use it
        if config.model.is_some() {
            let ws = resolve_workspace(agent_dir);
            return ResolvedProvider {
                provider: ws.provider,
                model: config.model.clone(),
            };
        }
    }
    // 2. Check workspace-level
    let ws = resolve_workspace(agent_dir);
    ResolvedProvider {
        provider: ws.provider,
        model: ws.model,
    }
}

/// Read provider + model from the workspace that contains this agent dir.
fn resolve_workspace(agent_dir: &std::path::Path) -> ResolvedProvider {
    if let Some(workspace_dir) = agent_dir.parent() {
        if let Some(workspaces_root) = workspace_dir.parent() {
            if let Ok(workspaces) = super::workspaces::read_workspaces(workspaces_root) {
                let ws_name = workspace_dir
                    .file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("");
                if let Some(ws) = workspaces.iter().find(|w| w.name == ws_name) {
                    let provider = ws
                        .provider
                        .as_ref()
                        .and_then(|p| p.parse::<Provider>().ok())
                        .unwrap_or(Provider::Anthropic);
                    return ResolvedProvider {
                        provider,
                        model: ws.model.clone(),
                    };
                }
            }
        }
    }
    ResolvedProvider {
        provider: Provider::Anthropic,
        model: None,
    }
}

#[tauri::command(rename_all = "snake_case")]
pub async fn send_message(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
    session_ids: State<'_, SessionIdTracker>,
    pid_map: State<'_, SessionPidMap>,
    agent_path: String,
    prompt: String,
    session_key: Option<String>,
    source: Option<String>,
    mode: Option<String>,
    working_dir_override: Option<String>,
    provider_override: Option<String>,
    model_override: Option<String>,
) -> Result<String, String> {
    let agent_dir = expand_tilde(&PathBuf::from(&agent_path));
    let working_dir = working_dir_override
        .as_ref()
        .map(|p| expand_tilde(&PathBuf::from(p)))
        .unwrap_or_else(|| agent_dir.clone());
    tracing::info!("[houston:session] send_message agent_path={agent_path} working_dir={}", working_dir.display());
    if !agent_dir.exists() {
        std::fs::create_dir_all(&agent_dir)
            .map_err(|e| format!("Failed to create agent directory: {e}"))?;
    }
    agent::seed_agent(&agent_dir)?;
    // Chat-level override takes priority over agent/workspace config.
    let provider = if let Some(ref prov_str) = provider_override {
        let p = prov_str.parse::<Provider>().map_err(|_| format!("Unknown provider: {prov_str}"))?;
        ResolvedProvider { provider: p, model: model_override.clone() }
    } else {
        let mut resolved = resolve_provider(&agent_dir);
        if let Some(ref m) = model_override {
            resolved.model = Some(m.clone());
        }
        resolved
    };
    let mut system_prompt = agent::build_system_prompt(
        &agent_dir,
        working_dir_override.as_ref().map(|p| expand_tilde(&PathBuf::from(p))).as_deref(),
        mode.as_deref(),
    );

    // Append Composio integration guidance to the system prompt.
    // Agents use the `composio` CLI (not MCP) to access integrations.
    system_prompt.push_str(
        "\n\n---\n\n# Integrations — Composio CLI\n\n\
         Before using any intagration WAIT AND READ THIS. Even if there are installed MCPs try to use Composio CLI to manage the interaction \
         Always look if the tools is available in Composio first and try to install it, even if there's an available MCP for the integration \
         Quick reference:\n\
         - `composio search \"<what you want to do>\"` — find the right tool\n\
         - `composio execute <TOOL_SLUG> -d '{ ... }'` — run a tool\n\
         - `composio execute <TOOL_SLUG> --get-schema` — see required params\n\n\
         Always search first, then execute.\n\n\
         ## When an app is not connected\n\n\
         If `composio execute` fails because no account is linked for that \
         toolkit, DO NOT open the browser for the user and DO NOT tell them \
         to go to the Integrations tab. Instead:\n\n\
         1. Offer to help connect the app right now. Ask in a friendly way, \
            e.g. \"I'd need you to connect your Gmail first. Want me to help?\"\n\
         2. If the user says yes, run `composio link <toolkit> --no-wait` via \
            Bash and parse the JSON output.\n\
         3. Present the `redirect_url` from that JSON as a markdown link. \
            **IMPORTANT**: append `#houston_toolkit=<toolkit>` to the URL so \
            the Houston chat can render it as a rich connect card with live \
            connection status instead of a plain button. Example: if the \
            JSON has `\"toolkit\": \"gmail\"` and \
            `\"redirect_url\": \"https://connect.composio.dev/link/lk_abc\"`, \
            output exactly: \
            `[Connect Gmail](https://connect.composio.dev/link/lk_abc#houston_toolkit=gmail)`. \
            The card renders the app name/logo and handles the click for you.\n\
         4. After they tell you they've approved in the browser, retry the \
            original action.",
    );

    let source = source.unwrap_or_else(|| "desktop".to_string());
    let session_key = session_key.ok_or_else(|| "session_key is required".to_string())?;
    let agent_key = format!("{}:{}", working_dir.to_string_lossy(), session_key);
    let sid_handle = session_ids
        .get_for_session(&agent_key, &agent_path, &session_key)
        .await;
    let resume_id = sid_handle.get().await;
    tracing::debug!(
        "[houston:session] resume_id={:?} for key={}",
        resume_id, agent_key
    );

    houston_tauri::session_runner::spawn_and_monitor(
        &app_handle,
        agent_path.clone(),
        session_key.clone(),
        prompt.clone(),
        resume_id,
        working_dir,
        Some(system_prompt),
        Some(sid_handle),
        Some(PersistOptions {
            db: state.db.clone(),
            source: source.clone(),
            user_message: Some(prompt),
            claude_session_id: None,
        }),
        Some(pid_map.inner().clone()),
        provider.provider,
        provider.model.clone(),
    );

    Ok(session_key)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn load_chat_history(
    state: State<'_, AppState>,
    agent_path: String,
    session_key: String,
) -> Result<Vec<serde_json::Value>, String> {
    let working_dir = expand_tilde(&PathBuf::from(&agent_path));
    let sid_path = houston_tauri::session_id_tracker::session_id_path(&working_dir, &session_key);

    let Some(claude_session_id) = std::fs::read_to_string(&sid_path)
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
    else {
        return Ok(Vec::new());
    };

    let mut rows = state
        .db
        .list_chat_feed_by_session(&claude_session_id)
        .await
        .map_err(|e| e.to_string())?;

    rows.sort_by(|a, b| a.timestamp.cmp(&b.timestamp));

    Ok(rows
        .into_iter()
        .map(|row| {
            serde_json::json!({
                "feed_type": row.feed_type,
                "data": serde_json::from_str::<serde_json::Value>(&row.data_json)
                    .unwrap_or(serde_json::Value::String(row.data_json)),
            })
        })
        .collect())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn start_onboarding_session(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
    session_ids: State<'_, SessionIdTracker>,
    pid_map: State<'_, SessionPidMap>,
    agent_path: String,
    session_key: String,
) -> Result<(), String> {
    let working_dir = expand_tilde(&PathBuf::from(&agent_path));
    agent::seed_agent(&working_dir)?;
    let mut system_prompt = agent::build_system_prompt(&working_dir, None, None);

    system_prompt.push_str(
        "\n\n---\n\n# Onboarding\n\n\
         This is a brand new agent with no configuration yet. \
         Welcome the user and briefly tell them what they can provide to get this agent working:\n\n\
         - A job description — What role do you want me to perform? \
           e.g. SDR, Executive assistant, Customer Support Agent, Engineer.\n\
         - Tools and integrations — Need Gmail or Slack? You can ask me to connect any tool \
           that has an API or an MCP, and those that don't have one, we'll find a way around.\n\
         - Routines (anything to run on a schedule)\n\n\
         Keep it short and warm. End with something like \
         \"Or if you'd rather skip setup and jump straight in, just tell me what you need — \
         we can figure it out as we go.\"\n\n\
         IMPORTANT — Setup validation: Once the user provides their job description, \
         you MUST write BOTH of these before setup is complete:\n\
         1. Update CLAUDE.md at the workspace root with the agent's role, responsibilities, \
            and rules based on what the user described.\n\
         2. Create at least one skill file in .agents/skills/ \
            (e.g. .agents/skills/core-workflow.md) with an ## Instructions section covering \
            the agent's primary workflow. Use the skill.sh convention: each skill is a markdown \
            file with ## Instructions and ## Learnings sections.\n\n\
         Do NOT consider setup complete until both CLAUDE.md and at least one skill have been \
         written. If the user skips the description and jumps straight to a task, still write \
         a CLAUDE.md and skill based on what you can infer from the task.",
    );

    let agent_key = format!("{}:{}", working_dir.to_string_lossy(), session_key);
    let sid_handle = session_ids
        .get_for_session(&agent_key, &agent_path, &session_key)
        .await;
    let resume_id = sid_handle.get().await;

    let provider = resolve_provider(&working_dir);

    houston_tauri::session_runner::spawn_and_monitor(
        &app_handle,
        agent_path.clone(),
        session_key.clone(),
        ".".to_string(),
        resume_id,
        working_dir,
        Some(system_prompt),
        Some(sid_handle),
        Some(PersistOptions {
            db: state.db.clone(),
            source: "desktop".to_string(),
            user_message: None,
            claude_session_id: None,
        }),
        Some(pid_map.inner().clone()),
        provider.provider,
        provider.model,
    );

    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn stop_session(
    app_handle: tauri::AppHandle,
    pid_map: State<'_, SessionPidMap>,
    agent_path: String,
    session_key: String,
) -> Result<(), String> {
    if let Some(pid) = pid_map.remove(&session_key).await {
        tracing::info!("[houston:session] stopping session {session_key} (pid {pid})");
        // Kill the Claude CLI process
        std::process::Command::new("kill")
            .arg("-TERM")
            .arg(pid.to_string())
            .output()
            .ok();

        // Emit "Stopped by user" so the UI shows a message
        let _ = app_handle.emit(
            "houston-event",
            HoustonEvent::FeedItem {
                agent_path: agent_path.clone(),
                session_key: session_key.clone(),
                item: houston_sessions::FeedItem::SystemMessage(
                    "Stopped by user".into(),
                ),
            },
        );
        let _ = app_handle.emit(
            "houston-event",
            HoustonEvent::SessionStatus {
                agent_path,
                session_key,
                status: "completed".into(),
                error: None,
            },
        );
    }
    Ok(())
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct SummarizeResult {
    pub title: String,
    pub description: String,
}

/// Quick Haiku call to generate a concise title + description for an activity.
#[tauri::command(rename_all = "snake_case")]
pub async fn summarize_activity(message: String) -> Result<SummarizeResult, String> {
    let prompt = format!(
        "Generate a title and description for this task.\n\
         Title: max 6 words, concise. Description: 1 short sentence.\n\
         Return ONLY valid JSON, no markdown fences:\n\
         {{\"title\": \"...\", \"description\": \"...\"}}\n\n\
         Task: {message}"
    );

    let mut cmd = tokio::process::Command::new("claude");
    cmd.env("PATH", houston_sessions::claude_path::shell_path());
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
        .map_err(|e| format!("Failed to spawn claude: {e}"))?;

    if let Some(mut stdin) = child.stdin.take() {
        stdin
            .write_all(prompt.as_bytes())
            .await
            .map_err(|e| format!("Failed to write prompt: {e}"))?;
        drop(stdin);
    }

    let output = child
        .wait_with_output()
        .await
        .map_err(|e| format!("Claude process failed: {e}"))?;

    let raw = String::from_utf8_lossy(&output.stdout).trim().to_string();

    // Strip markdown code fences if haiku wraps the JSON
    let json_str = raw
        .trim_start_matches("```json")
        .trim_start_matches("```")
        .trim_end_matches("```")
        .trim();

    serde_json::from_str(json_str)
        .map_err(|e| format!("Failed to parse response: {e}\nRaw: {raw}"))
}
