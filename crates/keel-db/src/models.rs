pub use crate::issue_types::IssueStatus;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub folder_path: String,
    pub pm_instructions: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Issue {
    pub id: String,
    pub project_id: String,
    pub title: String,
    pub description: String,
    pub status: IssueStatus,
    pub tags: Option<String>,
    pub position: i32,
    pub session_id: Option<String>,
    pub claude_session_id: Option<String>,
    pub output_files: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    /// IDs of issues that must be Done/Cancelled before this issue can start.
    #[serde(default)]
    pub blocked_by_ids: Vec<String>,
}

impl Issue {
    pub fn parsed_tags(&self) -> Vec<String> {
        self.tags
            .as_deref()
            .and_then(|s| serde_json::from_str(s).ok())
            .unwrap_or_default()
    }

    pub fn parsed_output_files(&self) -> Vec<String> {
        self.output_files
            .as_deref()
            .and_then(|s| serde_json::from_str(s).ok())
            .unwrap_or_default()
    }

    /// Returns true if this issue has at least one dependency that is not yet Done or Cancelled.
    pub fn is_blocked(&self, all_issues: &[Issue]) -> bool {
        self.blocked_by_ids.iter().any(|dep_id| {
            all_issues
                .iter()
                .find(|i| &i.id == dep_id)
                .map(|i| !matches!(i.status, IssueStatus::Done | IssueStatus::Cancelled))
                .unwrap_or(false)
        })
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Session {
    pub id: String,
    pub job_id: Option<String>,
    pub claude_session_id: Option<String>,
    pub status: String,
    pub prompt: String,
    pub created_at: String,
    pub completed_at: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SessionEvent {
    pub id: i64,
    pub session_id: String,
    pub event_type: String,
    pub content: String,
    pub timestamp: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Routine {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub description: String,
    pub trigger_type: String,
    pub trigger_config: String,
    pub status: String,
    pub run_count: i64,
    pub approval_count: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct RoutineRun {
    pub id: String,
    pub routine_id: String,
    pub status: String,
    pub output_summary: Option<String>,
    pub created_at: String,
    pub completed_at: Option<String>,
}
