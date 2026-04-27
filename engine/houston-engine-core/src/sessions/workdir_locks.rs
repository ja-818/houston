use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tokio::sync::{Mutex, OwnedMutexGuard};

pub type WorkdirSessionGuard = OwnedMutexGuard<()>;

#[derive(Default, Clone)]
pub struct WorkdirLocks {
    inner: Arc<Mutex<HashMap<PathBuf, Arc<Mutex<()>>>>>,
}

impl WorkdirLocks {
    pub async fn try_acquire(&self, working_dir: &Path) -> Option<WorkdirSessionGuard> {
        let key = normalize_key(working_dir);
        let lock = {
            let mut locks = self.inner.lock().await;
            locks
                .entry(key)
                .or_insert_with(|| Arc::new(Mutex::new(())))
                .clone()
        };
        lock.try_lock_owned().ok()
    }
}

fn normalize_key(path: &Path) -> PathBuf {
    std::fs::canonicalize(path).unwrap_or_else(|_| path.to_path_buf())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[tokio::test]
    async fn rejects_same_workdir_until_guard_drops() {
        let dir = TempDir::new().unwrap();
        let locks = WorkdirLocks::default();

        let first = locks.try_acquire(dir.path()).await;
        assert!(first.is_some());
        assert!(locks.try_acquire(dir.path()).await.is_none());

        drop(first);
        assert!(locks.try_acquire(dir.path()).await.is_some());
    }

    #[tokio::test]
    async fn allows_different_workdirs() {
        let one = TempDir::new().unwrap();
        let two = TempDir::new().unwrap();
        let locks = WorkdirLocks::default();

        let first = locks.try_acquire(one.path()).await;
        let second = locks.try_acquire(two.path()).await;

        assert!(first.is_some());
        assert!(second.is_some());
    }

    #[tokio::test]
    async fn canonicalizes_equivalent_existing_paths() {
        let dir = TempDir::new().unwrap();
        let locks = WorkdirLocks::default();
        let equivalent = dir.path().join(".");

        let first = locks.try_acquire(dir.path()).await;
        assert!(first.is_some());
        assert!(locks.try_acquire(&equivalent).await.is_none());
    }
}
