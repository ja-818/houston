use houston_tauri::agent as kw;
use std::path::Path;

pub fn seed_agent(dir: &Path) -> Result<(), String> {
    // CLAUDE.md — user's project context, auto-read by Claude Code
    kw::seed_file(dir, "CLAUDE.md", DEFAULT_CLAUDE_MD)?;

    // Symlink AGENTS.md → CLAUDE.md so Codex auto-reads the same content
    let agents_md = dir.join("AGENTS.md");
    if !agents_md.exists() {
        #[cfg(unix)]
        {
            let _ = std::os::unix::fs::symlink("CLAUDE.md", &agents_md);
        }
        #[cfg(windows)]
        {
            let _ = std::os::windows::fs::symlink_file("CLAUDE.md", &agents_md);
        }
    }

    // .houston/prompts/ — Houston-controlled system prompt files
    let prompts_dir = dir.join(".houston/prompts");
    let modes_dir = prompts_dir.join("modes");
    std::fs::create_dir_all(&modes_dir)
        .map_err(|e| format!("Failed to create .houston/prompts/modes: {e}"))?;

    kw::seed_file(&prompts_dir, "system.md", DEFAULT_SYSTEM_PROMPT)?;
    kw::seed_file(
        &prompts_dir,
        "self-improvement.md",
        houston_tauri::self_improvement::SELF_IMPROVEMENT_GUIDANCE,
    )?;

    Ok(())
}

/// Build the system prompt by concatenating files in deterministic order.
///
/// The system prompt is Houston's behavioral layer — injected via `--system-prompt`
/// (Claude) or `-c developer_instructions` (Codex). Project context lives in
/// CLAUDE.md / AGENTS.md and is auto-read by the CLIs, NOT included here.
///
/// Assembly order:
/// 1. Working directory constraint (computed)
/// 2. `.houston/prompts/system.md` (always)
/// 3. `.houston/prompts/modes/{mode}.md` (if mode is set)
/// 4. `.houston/prompts/self-improvement.md` (always)
/// 5. Learnings snapshot (computed)
/// 6. Skills index (computed)
/// 7. Integrations context (computed)
pub fn build_system_prompt(
    dir: &Path,
    working_dir_override: Option<&Path>,
    mode: Option<&str>,
) -> String {
    let mut parts = Vec::new();
    let prompts_dir = dir.join(".houston/prompts");

    // 1. Working directory constraint — MUST be first so the agent sees it immediately
    let effective_dir = working_dir_override.unwrap_or(dir);
    let working_dir = effective_dir.to_string_lossy();
    parts.push(format!(
        "# Working Directory — MANDATORY\n\n\
         Your working directory is: `{working_dir}`\n\n\
         **CRITICAL RULES:**\n\
         - ALL files you create, read, or modify MUST be within this directory.\n\
         - NEVER create files outside this directory (not in ~/, ~/.agents/, ~/Development/, /tmp/, or anywhere else).\n\
         - Skills go in `.agents/skills/` (relative to this directory).\n\
         - Houston data goes in `.houston/` (relative to this directory).\n\
         - If you need a new file or folder, create it HERE.\n\
         - When referencing paths, always use paths relative to or inside `{working_dir}`."
    ));
    tracing::info!("[agent] system prompt working_dir={working_dir}");

    // 2. Base system prompt (always)
    if let Ok(content) = std::fs::read_to_string(prompts_dir.join("system.md")) {
        parts.push(content);
    } else {
        parts.push(DEFAULT_SYSTEM_PROMPT.to_string());
    }

    // 3. Mode-specific overlay (if mode is set)
    if let Some(m) = mode {
        let mode_path = prompts_dir.join(format!("modes/{m}.md"));
        // Fall back to .houston/prompts/{m}.md for backwards compat
        let fallback_path = prompts_dir.join(format!("{m}.md"));
        if let Ok(content) = std::fs::read_to_string(&mode_path)
            .or_else(|_| std::fs::read_to_string(&fallback_path))
        {
            parts.push(content);
        } else {
            tracing::warn!("[agent] mode file not found: {m}.md");
        }
    }

    // 4. Self-improvement guidance (always — use latest hardcoded version)
    parts.push(houston_tauri::self_improvement::SELF_IMPROVEMENT_GUIDANCE.to_string());

    // 5. Skills index (read from .agents/skills — skill.sh convention)
    let skills_dir = dir.join(".agents/skills");
    if let Ok(index) = houston_skills::build_skills_index(&skills_dir) {
        if !index.is_empty() {
            parts.push(index);
        }
    }

    // 7. Integrations context (tracked per-agent)
    let integrations_path = dir.join(".houston/integrations.json");
    if let Ok(content) = std::fs::read_to_string(&integrations_path) {
        let names: Vec<String> =
            serde_json::from_str::<Vec<serde_json::Value>>(&content)
                .ok()
                .map(|arr| {
                    arr.iter()
                        .filter_map(|v| v.get("toolkit").and_then(|t| t.as_str()).map(String::from))
                        .collect()
                })
                .or_else(|| {
                    serde_json::from_str::<serde_json::Map<String, serde_json::Value>>(&content)
                        .ok()
                        .map(|map| map.keys().cloned().collect())
                })
                .unwrap_or_default();

        if !names.is_empty() {
            parts.push(format!(
                "# Integrations — Previously Used\n\n\
                 You have used these Composio integrations in past sessions: {}.\n\
                 Prefer these when the task involves their services.",
                names.join(", ")
            ));
        }
    }

    let prompt = parts.join("\n\n---\n\n");
    tracing::debug!(
        "[agent] system prompt assembled ({} chars, {} sections, mode={:?})",
        prompt.len(),
        parts.len(),
        mode
    );
    prompt
}

const DEFAULT_SYSTEM_PROMPT: &str = "\
You are an AI assistant running inside Houston, \
a native desktop app. Your workspace files are injected below. Follow them.\n\n\
Never use emojis unless being asked to.";

const DEFAULT_CLAUDE_MD: &str = r#"# Houston Agent

## Role
You are a helpful AI assistant.

## Rules
- Be concise and direct
- Ask before making destructive changes
- Explain your reasoning when making decisions
"#;
