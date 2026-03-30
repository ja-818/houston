//! keel-scheduler — Heartbeat and cron scheduling for AI agent desktop apps.
//!
//! Produces `KeelInput::heartbeat` and `KeelInput::cron` events into the
//! keel-events queue. Extracted from Houston's routine_scheduler pattern
//! to be reusable across apps.

pub mod cron_job;
pub mod heartbeat;
pub mod schedule_types;
pub mod scheduler;

// Re-export key types for convenience.
pub use cron_job::CronJobConfig;
pub use heartbeat::HeartbeatConfig;
pub use schedule_types::ScheduleType;
pub use scheduler::Scheduler;
