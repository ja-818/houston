use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tokio::sync::{Mutex, OwnedMutexGuard};

#[derive(Clone, Debug, Hash, PartialEq, Eq)]
pub struct SessionIdentity {
    agent_path: String,
    session_key: String,
}

impl SessionIdentity {
    pub fn new(agent_path: String, session_key: String) -> Self {
        Self {
            agent_path,
            session_key,
        }
    }
}

#[derive(Default, Clone)]
pub struct SessionControl {
    inner: Arc<Mutex<HashMap<SessionIdentity, SessionControlEntry>>>,
}

#[derive(Default)]
struct SessionControlEntry {
    generation: u64,
    active_or_queued: usize,
}

pub type SessionTurnGuard = OwnedMutexGuard<()>;

#[derive(Default, Clone)]
pub struct SessionTurnLocks {
    inner: Arc<Mutex<HashMap<SessionIdentity, Arc<Mutex<()>>>>>,
}

impl SessionTurnLocks {
    pub async fn acquire(&self, id: &SessionIdentity) -> SessionTurnGuard {
        let lock = {
            let mut locks = self.inner.lock().await;
            locks
                .entry(id.clone())
                .or_insert_with(|| Arc::new(Mutex::new(())))
                .clone()
        };
        lock.lock_owned().await
    }
}

#[derive(Default, Clone)]
pub struct WorkdirActivity {
    inner: Arc<Mutex<HashMap<PathBuf, WorkdirActivityEntry>>>,
}

#[derive(Default)]
struct WorkdirActivityEntry {
    active: usize,
    generation: u64,
}

pub struct WorkdirActivityRegistration {
    key: PathBuf,
    generation: u64,
    started_with_overlap: bool,
}

impl WorkdirActivity {
    pub async fn register(&self, working_dir: &Path) -> WorkdirActivityRegistration {
        let key = normalize_key(working_dir);
        let mut inner = self.inner.lock().await;
        let entry = inner.entry(key.clone()).or_default();
        let started_with_overlap = entry.active > 0;
        if started_with_overlap {
            entry.generation = entry.generation.saturating_add(1);
        }
        entry.active += 1;
        WorkdirActivityRegistration {
            key,
            generation: entry.generation,
            started_with_overlap,
        }
    }

    pub async fn finish(&self, registration: WorkdirActivityRegistration) -> bool {
        let mut inner = self.inner.lock().await;
        let Some(entry) = inner.get_mut(&registration.key) else {
            return true;
        };
        let overlapped =
            registration.started_with_overlap || entry.generation != registration.generation;
        entry.active = entry.active.saturating_sub(1);
        if entry.active == 0 {
            inner.remove(&registration.key);
        }
        overlapped
    }
}

fn normalize_key(path: &Path) -> PathBuf {
    std::fs::canonicalize(path).unwrap_or_else(|_| path.to_path_buf())
}

impl SessionControl {
    pub async fn register(&self, id: &SessionIdentity) -> u64 {
        let mut inner = self.inner.lock().await;
        let entry = inner.entry(id.clone()).or_default();
        entry.active_or_queued += 1;
        entry.generation
    }

    pub async fn finish(&self, id: &SessionIdentity) {
        let mut inner = self.inner.lock().await;
        if let Some(entry) = inner.get_mut(id) {
            entry.active_or_queued = entry.active_or_queued.saturating_sub(1);
            if entry.active_or_queued == 0 {
                inner.remove(id);
            }
        }
    }

    pub async fn cancel(&self, id: &SessionIdentity) -> bool {
        let mut inner = self.inner.lock().await;
        let Some(entry) = inner.get_mut(id) else {
            return false;
        };
        entry.generation = entry.generation.saturating_add(1);
        entry.active_or_queued > 0
    }

    pub async fn is_stale(&self, id: &SessionIdentity, generation: u64) -> bool {
        let inner = self.inner.lock().await;
        inner
            .get(id)
            .map(|entry| entry.generation != generation)
            .unwrap_or(true)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn cancel_invalidates_existing_generation() {
        let control = SessionControl::default();
        let id = SessionIdentity::new("/tmp/a".into(), "chat-1".into());
        let generation = control.register(&id).await;

        assert!(!control.is_stale(&id, generation).await);
        assert!(control.cancel(&id).await);
        assert!(control.is_stale(&id, generation).await);
    }

    #[tokio::test]
    async fn new_registration_after_cancel_gets_current_generation() {
        let control = SessionControl::default();
        let id = SessionIdentity::new("/tmp/a".into(), "chat-1".into());
        let old_generation = control.register(&id).await;

        assert!(control.cancel(&id).await);
        let new_generation = control.register(&id).await;

        assert_ne!(old_generation, new_generation);
        assert!(!control.is_stale(&id, new_generation).await);
    }

    #[tokio::test]
    async fn turn_locks_allow_different_sessions_in_same_folder() {
        let locks = SessionTurnLocks::default();
        let first = SessionIdentity::new("/tmp/a".into(), "chat-1".into());
        let second = SessionIdentity::new("/tmp/a".into(), "chat-2".into());
        let _guard = locks.acquire(&first).await;

        tokio::time::timeout(std::time::Duration::from_millis(20), locks.acquire(&second))
            .await
            .expect("different session keys should not block each other");
    }

    #[tokio::test]
    async fn workdir_activity_marks_both_overlapping_runs_ambiguous() {
        let dir = tempfile::TempDir::new().unwrap();
        let activity = WorkdirActivity::default();
        let first = activity.register(dir.path()).await;
        let second = activity.register(dir.path()).await;

        assert!(activity.finish(second).await);
        assert!(activity.finish(first).await);
    }
}
