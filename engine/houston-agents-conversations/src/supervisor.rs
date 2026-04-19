use houston_ui_events::{DynEventSink, HoustonEvent};
use tokio::task::JoinSet;

/// Generic session supervisor -- holds the semaphore permit, runs any monitor future,
/// and catches panics.
///
/// On panic, emits an error toast via the injected sink with the provided
/// `context` string. Used for sessions where the monitor has its own status
/// handling.
pub async fn supervise_monitor(
    sink: DynEventSink,
    permit: tokio::sync::SemaphorePermit<'static>,
    monitor: impl std::future::Future<Output = ()> + Send + 'static,
    context: &'static str,
) {
    let _permit = permit;
    let mut set: JoinSet<()> = JoinSet::new();
    set.spawn(monitor);
    while let Some(result) = set.join_next().await {
        if let Err(join_err) = result {
            tracing::error!(
                "[houston:supervisor] {context} monitor failed (panic={}): {join_err:?}",
                join_err.is_panic()
            );
            sink.emit(HoustonEvent::Toast {
                message: format!("{context} failed unexpectedly"),
                variant: "error".into(),
            });
        }
    }
}

#[cfg(test)]
mod tests {
    use tokio::task::JoinSet;

    /// A panic in a `JoinSet` task surfaces as `JoinError::is_panic()`,
    /// not as an unwinding panic on the supervisor.
    #[tokio::test]
    async fn test_joinset_catches_panic() {
        let mut set: JoinSet<()> = JoinSet::new();
        set.spawn(async { panic!("deliberate test panic") });

        let result = set.join_next().await.expect("should have a result");
        assert!(result.is_err());
        assert!(result.unwrap_err().is_panic());
    }

    /// A panic in session A's JoinSet does not propagate to session B's JoinSet.
    #[tokio::test]
    async fn test_session_panic_isolation() {
        let mut set_a: JoinSet<()> = JoinSet::new();
        let mut set_b: JoinSet<()> = JoinSet::new();

        set_a.spawn(async { panic!("session A panics") });
        set_b.spawn(async { /* session B completes normally */ });

        let result_a = set_a.join_next().await.expect("set_a should complete");
        let result_b = set_b.join_next().await.expect("set_b should complete");

        assert!(result_a.is_err(), "session A should report a failure");
        assert!(
            result_a.unwrap_err().is_panic(),
            "session A error should be a panic"
        );
        assert!(
            result_b.is_ok(),
            "session B should be unaffected by session A's panic"
        );
    }

    /// Multiple concurrent JoinSets are independent -- a panic in one set does
    /// not affect tasks in another set running simultaneously.
    #[tokio::test]
    async fn test_concurrent_session_isolation() {
        let (tx_b, mut rx_b) = tokio::sync::mpsc::unbounded_channel::<bool>();

        let handle_a = tokio::spawn(async move {
            let mut set: JoinSet<()> = JoinSet::new();
            set.spawn(async { panic!("session A panics while B runs") });
            set.join_next().await
        });

        let handle_b = tokio::spawn(async move {
            let mut set: JoinSet<()> = JoinSet::new();
            // Session B does real work and reports success.
            set.spawn(async move {
                let _ = tx_b.send(true);
            });
            set.join_next().await
        });

        let result_a = handle_a.await.expect("supervisor A should not panic");
        let result_b = handle_b.await.expect("supervisor B should not panic");

        assert!(
            result_a.is_some_and(|r| r.is_err()),
            "session A should fail"
        );
        assert!(
            result_b.is_some_and(|r| r.is_ok()),
            "session B should succeed"
        );
        assert_eq!(
            rx_b.try_recv().ok(),
            Some(true),
            "session B work should have run"
        );
    }
}
