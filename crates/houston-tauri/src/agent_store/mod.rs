//! Typed read/write operations for `.houston/` agent files.
//!
//! Every Houston app project stores agent-visible data in a `.houston/` folder
//! alongside the project root. This module provides [`AgentStore`] for
//! safe, atomic CRUD over those files.

pub mod channels;
pub mod commands;
pub mod config;
pub mod conversations;
pub mod goals;
mod helpers;
pub mod log;
pub mod routines;
pub mod skills;
pub mod activity;
pub mod types;

pub use types::*;

use std::path::{Path, PathBuf};

/// File-backed store for `.houston/` agent data.
///
/// All write operations use atomic temp-file + rename to prevent corruption.
pub struct AgentStore {
    root: PathBuf,
}

impl AgentStore {
    pub fn new(project_folder: &Path) -> Self {
        Self {
            root: project_folder.to_path_buf(),
        }
    }

    pub fn ensure_houston_dir(&self) -> Result<(), String> {
        helpers::ensure_houston_dir(&self.root)
    }

    // -- Conversations --
    pub fn list_conversations(&self) -> Result<Vec<ConversationEntry>, String> {
        conversations::list(&self.root)
    }

    // -- Activity --
    pub fn list_activity(&self) -> Result<Vec<Activity>, String> {
        activity::list(&self.root)
    }
    pub fn create_activity(&self, title: &str, description: &str) -> Result<Activity, String> {
        self.ensure_houston_dir()?;
        activity::create(&self.root, title, description)
    }
    pub fn update_activity(&self, id: &str, updates: ActivityUpdate) -> Result<Activity, String> {
        activity::update(&self.root, id, updates)
    }
    pub fn delete_activity(&self, id: &str) -> Result<(), String> {
        activity::delete(&self.root, id)
    }

    // -- Routines --
    pub fn list_routines(&self) -> Result<Vec<Routine>, String> {
        routines::list(&self.root)
    }
    pub fn create_routine(&self, input: NewRoutine) -> Result<Routine, String> {
        self.ensure_houston_dir()?;
        routines::create(&self.root, input)
    }
    pub fn update_routine(&self, id: &str, updates: RoutineUpdate) -> Result<Routine, String> {
        routines::update(&self.root, id, updates)
    }
    pub fn delete_routine(&self, id: &str) -> Result<(), String> {
        routines::delete(&self.root, id)
    }

    // -- Goals --
    pub fn list_goals(&self) -> Result<Vec<Goal>, String> {
        goals::list(&self.root)
    }
    pub fn create_goal(&self, title: &str) -> Result<Goal, String> {
        self.ensure_houston_dir()?;
        goals::create(&self.root, title)
    }
    pub fn update_goal(&self, id: &str, updates: GoalUpdate) -> Result<Goal, String> {
        goals::update(&self.root, id, updates)
    }
    pub fn delete_goal(&self, id: &str) -> Result<(), String> {
        goals::delete(&self.root, id)
    }

    // -- Channels --
    pub fn list_channels(&self) -> Result<Vec<ChannelEntry>, String> {
        channels::list(&self.root)
    }
    pub fn add_channel(&self, input: NewChannel) -> Result<ChannelEntry, String> {
        self.ensure_houston_dir()?;
        channels::add(&self.root, input)
    }
    pub fn remove_channel(&self, id: &str) -> Result<(), String> {
        channels::remove(&self.root, id)
    }

    // -- Skills --
    pub fn list_skills(&self) -> Result<Vec<Skill>, String> {
        skills::list(&self.root)
    }
    pub fn read_skill(&self, name: &str) -> Result<Skill, String> {
        skills::read(&self.root, name)
    }
    pub fn write_skill(&self, name: &str, instructions: &str, learnings: &str) -> Result<(), String> {
        skills::write(&self.root, name, instructions, learnings)
    }
    pub fn delete_skill(&self, name: &str) -> Result<(), String> {
        skills::delete(&self.root, name)
    }

    // -- Log --
    pub fn append_log(&self, entry: &LogEntry) -> Result<(), String> {
        log::append(&self.root, entry)
    }
    pub fn read_log(&self) -> Result<Vec<LogEntry>, String> {
        log::read(&self.root)
    }

    // -- Config --
    pub fn read_config(&self) -> Result<ProjectConfig, String> {
        config::read(&self.root)
    }
    pub fn write_config(&self, cfg: &ProjectConfig) -> Result<(), String> {
        config::write(&self.root, cfg)
    }
}
