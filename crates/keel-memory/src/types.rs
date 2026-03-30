use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Category of a stored memory.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum MemoryCategory {
    /// Summarized conversation context.
    Conversation,
    /// User preferences and settings.
    Preference,
    /// Project/domain context.
    Context,
    /// Learned skills and patterns.
    Skill,
    /// Factual information the agent learned.
    Fact,
}

impl std::fmt::Display for MemoryCategory {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Conversation => write!(f, "conversation"),
            Self::Preference => write!(f, "preference"),
            Self::Context => write!(f, "context"),
            Self::Skill => write!(f, "skill"),
            Self::Fact => write!(f, "fact"),
        }
    }
}

impl std::str::FromStr for MemoryCategory {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "conversation" => Ok(Self::Conversation),
            "preference" => Ok(Self::Preference),
            "context" => Ok(Self::Context),
            "skill" => Ok(Self::Skill),
            "fact" => Ok(Self::Fact),
            _ => Err(anyhow::anyhow!("unknown memory category: {}", s)),
        }
    }
}

/// A single persistent memory entry.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Memory {
    pub id: String,
    pub project_id: String,
    pub content: String,
    pub category: MemoryCategory,
    /// Origin of this memory: "agent", "user", "session:<id>", "compaction".
    pub source: String,
    pub tags: Vec<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Query parameters for searching memories.
#[derive(Debug, Clone, Default)]
pub struct MemoryQuery {
    pub project_id: Option<String>,
    pub category: Option<MemoryCategory>,
    /// FTS5 search text. When set, results are ranked by relevance.
    pub search_text: Option<String>,
    pub tags: Vec<String>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}
