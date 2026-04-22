use tokio::sync::mpsc;
use tracing::{debug, info};

use crate::types::HoustonInput;

/// Handle used by producers to push events into the queue.
///
/// Clone-friendly — distribute to any number of producers.
#[derive(Clone)]
pub struct EventQueueHandle {
    tx: mpsc::UnboundedSender<HoustonInput>,
}

impl EventQueueHandle {
    /// Push an input into the event queue.
    ///
    /// Returns an error if the queue has been shut down.
    pub fn push(&self, input: HoustonInput) -> anyhow::Result<()> {
        self.tx
            .send(input)
            .map_err(|e| anyhow::anyhow!("Event queue closed: {}", e))
    }
}

/// Async mpsc-based ordered event queue.
///
/// Inputs are processed strictly in the order they arrive.
pub struct EventQueue {
    rx: mpsc::UnboundedReceiver<HoustonInput>,
}

impl EventQueue {
    /// Create a new event queue, returning both the queue (consumer) and a
    /// cloneable handle (producer).
    pub fn new() -> (Self, EventQueueHandle) {
        let (tx, rx) = mpsc::unbounded_channel();
        let queue = Self { rx };
        let handle = EventQueueHandle { tx };
        (queue, handle)
    }

    /// Process inputs in order, calling `handler` for each one.
    ///
    /// Runs until the queue is closed (all handles dropped) or the provided
    /// `shutdown` future resolves.
    pub async fn process<F, Fut>(mut self, handler: F)
    where
        F: Fn(HoustonInput) -> Fut,
        Fut: std::future::Future<Output = ()>,
    {
        info!("Event queue started");
        while let Some(input) = self.rx.recv().await {
            debug!(
                input_id = %input.id,
                input_type = ?input.input_type,
                "Processing input"
            );
            handler(input).await;
        }
        info!("Event queue shut down (all producers dropped)");
    }

    /// Process inputs with a shutdown signal.
    ///
    /// Stops when either all producer handles are dropped or `shutdown`
    /// resolves — whichever comes first.
    pub async fn process_until<F, Fut>(
        mut self,
        handler: F,
        shutdown: tokio::sync::watch::Receiver<bool>,
    ) where
        F: Fn(HoustonInput) -> Fut,
        Fut: std::future::Future<Output = ()>,
    {
        info!("Event queue started (with shutdown signal)");
        let mut shutdown = shutdown;
        loop {
            tokio::select! {
                maybe_input = self.rx.recv() => {
                    match maybe_input {
                        Some(input) => {
                            debug!(
                                input_id = %input.id,
                                input_type = ?input.input_type,
                                "Processing input"
                            );
                            handler(input).await;
                        }
                        None => {
                            info!("Event queue shut down (all producers dropped)");
                            break;
                        }
                    }
                }
                _ = shutdown.changed() => {
                    if *shutdown.borrow() {
                        info!("Event queue shut down (shutdown signal received)");
                        break;
                    }
                }
            }
        }
    }
}
