//! Session concurrency control.
//!
//! Limits simultaneous AI CLI processes to avoid exhausting OS
//! file-descriptor and process limits. macOS caps open file descriptors
//! per process; each spawned `claude -p` with piped stdio consumes several.
//!
//! The cap defaults to 15 and can be loaded from preferences at startup via
//! `init_session_sem`.

use std::sync::{OnceLock, RwLock};
use tokio::sync::Semaphore;

const DEFAULT_CAP: usize = 15;

static CAP: RwLock<usize> = RwLock::new(DEFAULT_CAP);
static SEM: OnceLock<Semaphore> = OnceLock::new();

/// Initialize the session semaphore with a configurable capacity.
///
/// Call this once during app startup (before any session is submitted).
/// Subsequent calls are ignored — the semaphore is created exactly once.
/// If never called, the first `session_sem()` access creates a semaphore
/// with the default cap.
pub fn init_session_sem(cap: usize) {
    let cap = cap.max(1);
    *CAP.write().unwrap() = cap;
    let _ = SEM.set(Semaphore::new(cap));
}

/// Returns the configured concurrency cap (default 15).
#[allow(dead_code)]
pub fn session_concurrency_cap() -> usize {
    *CAP.read().unwrap()
}

/// Returns the global session semaphore, creating it with the current cap on first call.
pub fn session_sem() -> &'static Semaphore {
    SEM.get_or_init(|| Semaphore::new(*CAP.read().unwrap()))
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use super::*;

    #[test]
    fn default_cap_is_fifteen() {
        assert_eq!(DEFAULT_CAP, 15);
    }

    #[test]
    fn session_concurrency_cap_returns_at_least_one() {
        let cap = session_concurrency_cap();
        assert!(cap >= 1);
    }

    #[tokio::test]
    async fn semaphore_limits_concurrent_acquires() {
        // Use a local semaphore to test the queuing logic without touching the global.
        let sem = Arc::new(Semaphore::new(2));
        let p1 = sem.try_acquire().expect("first permit");
        let p2 = sem.try_acquire().expect("second permit");
        assert!(
            sem.try_acquire().is_err(),
            "third acquire should fail (cap=2)"
        );
        drop(p1);
        // After releasing one, acquisition should succeed again.
        let _p3 = sem.try_acquire().expect("permit after release");
        drop(p2);
    }

    #[tokio::test]
    async fn queued_job_starts_when_slot_opens() {
        // Simulate: semaphore at capacity -> queued -> released -> proceeds.
        let sem = Arc::new(Semaphore::new(1));
        let permit = sem.try_acquire().expect("initial permit");

        let sem2 = Arc::clone(&sem);
        let started = Arc::new(std::sync::atomic::AtomicBool::new(false));
        let started2 = Arc::clone(&started);

        let handle = tokio::spawn(async move {
            let _p = sem2.acquire().await.unwrap();
            started2.store(true, std::sync::atomic::Ordering::SeqCst);
        });

        // Give the spawned task a moment to reach the await point.
        tokio::time::sleep(std::time::Duration::from_millis(10)).await;
        assert!(
            !started.load(std::sync::atomic::Ordering::SeqCst),
            "should be waiting for slot"
        );

        // Release the slot — queued task should now proceed.
        drop(permit);
        handle.await.unwrap();
        assert!(
            started.load(std::sync::atomic::Ordering::SeqCst),
            "should have started after slot freed"
        );
    }
}
