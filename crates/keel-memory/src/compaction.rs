use crate::types::{Memory, MemoryCategory};

/// Configuration for session compaction.
#[derive(Debug, Clone)]
pub struct CompactionConfig {
    /// Maximum number of messages before a conversation should be compacted.
    pub max_conversation_length: usize,
    /// Prompt template for summarization. Use `{messages}` as placeholder.
    pub summary_prompt: String,
}

impl Default for CompactionConfig {
    fn default() -> Self {
        Self {
            max_conversation_length: 50,
            summary_prompt: DEFAULT_SUMMARY_PROMPT.to_string(),
        }
    }
}

const DEFAULT_SUMMARY_PROMPT: &str = "\
Summarize the following conversation into key facts, decisions, and context \
that should be remembered for future sessions. Be concise but preserve \
important details.\n\n\
Messages:\n{messages}";

/// Build a prompt that asks an LLM to summarize a conversation.
///
/// The actual LLM call is the responsibility of the consuming application;
/// this function only constructs the prompt string.
pub fn build_compaction_prompt(
    messages: &[String],
    config: &CompactionConfig,
) -> String {
    let joined = messages.join("\n");
    config.summary_prompt.replace("{messages}", &joined)
}

/// Create a `Memory` from a compaction summary.
///
/// The caller should persist this via `MemoryStore::create`.
pub fn compaction_to_memory(project_id: &str, summary: &str) -> Memory {
    let now = chrono::Utc::now();
    Memory {
        id: uuid::Uuid::new_v4().to_string(),
        project_id: project_id.to_string(),
        content: summary.to_string(),
        category: MemoryCategory::Conversation,
        source: "compaction".to_string(),
        tags: vec!["auto-compacted".to_string()],
        created_at: now,
        updated_at: now,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn build_prompt_substitutes_messages() {
        let messages = vec!["Hello".into(), "How are you?".into()];
        let config = CompactionConfig::default();
        let prompt = build_compaction_prompt(&messages, &config);

        assert!(prompt.contains("Hello"));
        assert!(prompt.contains("How are you?"));
        assert!(prompt.contains("Summarize the following"));
    }

    #[test]
    fn build_prompt_with_custom_template() {
        let messages = vec!["msg1".into()];
        let config = CompactionConfig {
            max_conversation_length: 10,
            summary_prompt: "Custom: {messages}".to_string(),
        };
        let prompt = build_compaction_prompt(&messages, &config);
        assert_eq!(prompt, "Custom: msg1");
    }

    #[test]
    fn compaction_to_memory_creates_valid_memory() {
        let mem = compaction_to_memory("proj-1", "Summary of the session.");

        assert_eq!(mem.project_id, "proj-1");
        assert_eq!(mem.content, "Summary of the session.");
        assert_eq!(mem.category, MemoryCategory::Conversation);
        assert_eq!(mem.source, "compaction");
        assert!(mem.tags.contains(&"auto-compacted".to_string()));
        assert!(!mem.id.is_empty());
    }
}
