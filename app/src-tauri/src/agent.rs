use houston_tauri::agent as kw;
use std::path::Path;

pub fn seed_agent(dir: &Path) -> Result<(), String> {
    kw::seed_file(dir, "CLAUDE.md", CLAUDE_MD)?;

    // Create .houston/prompts/ directory and seed editable prompt files
    let prompts_dir = dir.join(".houston/prompts");
    std::fs::create_dir_all(&prompts_dir)
        .map_err(|e| format!("Failed to create .houston/prompts: {e}"))?;
    kw::seed_file(&prompts_dir, "system.md", DEFAULT_SYSTEM_PROMPT)?;
    kw::seed_file(
        &prompts_dir,
        "self-improvement.md",
        houston_tauri::self_improvement::SELF_IMPROVEMENT_GUIDANCE,
    )?;

    Ok(())
}

pub fn build_system_prompt(dir: &Path) -> String {
    let mut parts = Vec::new();

    // 1. Base prompt (read from file, fall back to hardcoded default)
    let system_path = dir.join(".houston/prompts/system.md");
    let base = std::fs::read_to_string(&system_path)
        .unwrap_or_else(|_| DEFAULT_SYSTEM_PROMPT.to_string());
    parts.push(base);

    // 2. Self-improvement guidance (always use latest hardcoded version)
    parts.push(houston_tauri::self_improvement::SELF_IMPROVEMENT_GUIDANCE.to_string());

    // 3. Learnings snapshot
    let memory_dir = dir.join(".houston/memory");
    let config = houston_memory::LearningsConfig::default();
    if let Ok(prompt) = houston_memory::build_learnings_prompt(&memory_dir, &config) {
        if !prompt.is_empty() {
            parts.push(prompt);
        }
    }

    // 4. Skills index (read from .agents/skills — skill.sh convention)
    let skills_dir = dir.join(".agents/skills");
    if let Ok(index) = houston_skills::build_skills_index(&skills_dir) {
        if !index.is_empty() {
            parts.push(index);
        }
    }

    // 5. Integrations context (tracked per-agent)
    // The agent may write this as an array or a map — handle both.
    let integrations_path = dir.join(".houston/integrations.json");
    if let Ok(content) = std::fs::read_to_string(&integrations_path) {
        let names: Vec<String> =
            // Try array format: [{ "toolkit": "gmail", ... }]
            serde_json::from_str::<Vec<serde_json::Value>>(&content)
                .ok()
                .map(|arr| {
                    arr.iter()
                        .filter_map(|v| v.get("toolkit").and_then(|t| t.as_str()).map(String::from))
                        .collect()
                })
                // Fall back to map format: { "gmail": { ... } }
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

    // 6. Workspace files (CLAUDE.md)
    for (name, label) in &PROMPT_FILES {
        if let Ok(content) = std::fs::read_to_string(dir.join(name)) {
            parts.push(format!("# {label}\n\n{content}"));
        }
    }

    parts.join("\n\n---\n\n")
}

const PROMPT_FILES: [(&str, &str); 1] = [("CLAUDE.md", "CLAUDE.md — Agent Instructions")];

const DEFAULT_SYSTEM_PROMPT: &str = "\
You are an AI assistant running inside Houston, \
a native desktop app. Your workspace files are injected below. Follow them.\n\n\
Never use emojis unless being asked to.";

const CLAUDE_MD: &str = r#"# Houston Agent

## Role
You are a helpful AI assistant.

## Rules
- Be concise and direct
- Ask before making destructive changes
- Explain your reasoning when making decisions
"#;
