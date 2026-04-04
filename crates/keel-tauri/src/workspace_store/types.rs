//! Data types for `.keel/` workspace files.

use serde::{Deserialize, Serialize};

// -- Tasks --

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub description: String,
    pub status: String,
    pub claude_session_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TaskUpdate {
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub claude_session_id: Option<Option<String>>,
}

// -- Routines --

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Routine {
    pub id: String,
    pub name: String,
    pub description: String,
    pub trigger_type: String,
    pub trigger_config: serde_json::Value,
    pub status: String,
    pub approval_mode: String,
    pub claude_session_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct RoutineUpdate {
    pub name: Option<String>,
    pub description: Option<String>,
    pub trigger_type: Option<String>,
    pub trigger_config: Option<serde_json::Value>,
    pub status: Option<String>,
    pub approval_mode: Option<String>,
    pub claude_session_id: Option<Option<String>>,
}

/// Fields for creating a new routine (no id — generated server-side).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewRoutine {
    pub name: String,
    pub description: String,
    pub trigger_type: String,
    pub trigger_config: serde_json::Value,
    pub approval_mode: String,
}

// -- Goals --

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Goal {
    pub id: String,
    pub title: String,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct GoalUpdate {
    pub title: Option<String>,
    pub status: Option<String>,
}

// -- Channels --

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChannelEntry {
    pub id: String,
    pub channel_type: String,
    pub name: String,
    pub token: String,
}

/// Fields for adding a new channel.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewChannel {
    pub channel_type: String,
    pub name: String,
    pub token: String,
}

// -- Skills --

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Skill {
    pub name: String,
    pub instructions: String,
    pub learnings: String,
}

// -- Log --

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEntry {
    pub session_id: String,
    pub task_id: Option<String>,
    pub status: String,
    pub duration_ms: Option<u64>,
    pub cost_usd: Option<f64>,
    pub timestamp: String,
}

// -- Config --

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectConfig {
    pub name: String,
    pub claude_model: Option<String>,
    pub claude_effort: Option<String>,
}
