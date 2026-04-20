//! Re-export shim over `houston_engine_core::agents::self_improvement`.
//!
//! Phase 2D moved `SELF_IMPROVEMENT_GUIDANCE` into the engine; the constant
//! is reused verbatim by both the desktop adapter and any future REST callers
//! that assemble system prompts.

pub use houston_engine_core::agents::self_improvement::*;
