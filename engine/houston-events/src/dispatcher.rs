use std::sync::Arc;

use tracing::{debug, error, warn};

use crate::handler::{HandlerResponse, InputHandler};
use crate::types::HoustonInput;

/// Routes inputs to registered handlers based on input type.
pub struct EventDispatcher {
    handlers: Vec<Arc<dyn InputHandler>>,
}

impl EventDispatcher {
    pub fn new() -> Self {
        Self {
            handlers: Vec::new(),
        }
    }

    /// Register a handler. Handlers are checked in registration order.
    pub fn register(&mut self, handler: Arc<dyn InputHandler>) {
        self.handlers.push(handler);
    }

    /// Dispatch a single input to matching handlers.
    ///
    /// Every registered handler whose `handles()` returns true for the input
    /// type will be called. If no handler matches, the input is logged as
    /// unhandled.
    pub async fn dispatch(&self, input: &HoustonInput) -> Vec<anyhow::Result<HandlerResponse>> {
        let mut responses = Vec::new();
        let mut handled = false;

        for handler in &self.handlers {
            if handler.handles(&input.input_type) {
                handled = true;
                debug!(
                    input_id = %input.id,
                    input_type = ?input.input_type,
                    "Dispatching to handler"
                );
                match handler.handle(input).await {
                    Ok(response) => {
                        debug!(
                            input_id = %input.id,
                            response = ?response,
                            "Handler responded"
                        );
                        responses.push(Ok(response));
                    }
                    Err(e) => {
                        error!(
                            input_id = %input.id,
                            error = %e,
                            "Handler error"
                        );
                        responses.push(Err(e));
                    }
                }
            }
        }

        if !handled {
            warn!(
                input_id = %input.id,
                input_type = ?input.input_type,
                "No handler registered for input type"
            );
        }

        responses
    }
}

impl Default for EventDispatcher {
    fn default() -> Self {
        Self::new()
    }
}
