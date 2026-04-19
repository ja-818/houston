//! Typed read/write operations for `.houston/` agent files.
//!
//! Every Houston app project stores agent-visible data in a `.houston/` folder
//! alongside the project root. This module provides [`AgentStore`] for
//! safe, atomic CRUD over those files.

pub mod config;
pub mod helpers;
pub mod routine_runs;
pub mod routines;
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

    // -- Activity --
    pub fn list_activity(&self) -> Result<Vec<Activity>, String> {
        activity::list(&self.root)
    }
    pub fn create_activity(
        &self,
        title: &str,
        description: &str,
        agent: Option<&str>,
        worktree_path: Option<&str>,
    ) -> Result<Activity, String> {
        self.ensure_houston_dir()?;
        activity::create(&self.root, title, description, agent, worktree_path)
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

    // -- Routine Runs --
    pub fn list_routine_runs(&self) -> Result<Vec<RoutineRun>, String> {
        routine_runs::list(&self.root)
    }
    pub fn list_routine_runs_for(&self, routine_id: &str) -> Result<Vec<RoutineRun>, String> {
        routine_runs::list_for_routine(&self.root, routine_id)
    }
    pub fn create_routine_run(&self, routine_id: &str) -> Result<RoutineRun, String> {
        self.ensure_houston_dir()?;
        routine_runs::create(&self.root, routine_id)
    }
    pub fn update_routine_run(&self, id: &str, updates: RoutineRunUpdate) -> Result<RoutineRun, String> {
        routine_runs::update(&self.root, id, updates)
    }

    // -- Config --
    pub fn read_config(&self) -> Result<ProjectConfig, String> {
        config::read(&self.root)
    }
    pub fn write_config(&self, cfg: &ProjectConfig) -> Result<(), String> {
        config::write(&self.root, cfg)
    }
}
