//! Houston product prompts, the authoritative identity copy for the Houston
//! desktop app.
//!
//! These strings are the product layer. The engine is prompt-agnostic: it
//! assembles per-agent context from disk, while this module defines how the
//! Houston desktop agent behaves and speaks.

mod actions_memory;
mod base;
mod integrations;
mod onboarding;
mod routines;

pub use actions_memory::SELF_IMPROVEMENT_GUIDANCE;
pub use base::HOUSTON_SYSTEM_PROMPT;
pub use integrations::COMPOSIO_GUIDANCE;
pub use onboarding::ONBOARDING_GUIDANCE;
pub use routines::ROUTINES_GUIDANCE;

/// Build the composite system prompt the engine uses as its fallback.
/// Order: base identity, actions/memory guidance, routines guidance, Composio guidance.
pub fn system_prompt() -> String {
    format!(
        "{HOUSTON_SYSTEM_PROMPT}\n\n---\n\n{SELF_IMPROVEMENT_GUIDANCE}\n\n---\n\n{ROUTINES_GUIDANCE}{COMPOSIO_GUIDANCE}"
    )
}

/// Onboarding prompt suffix, appended after `system_prompt()` on first-run sessions.
pub fn onboarding_prompt() -> String {
    ONBOARDING_GUIDANCE.to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn system_prompt_contains_new_interaction_gates() {
        let prompt = system_prompt();

        assert!(prompt.contains("# Houston Context"));
        assert!(prompt.contains("# Interaction Procedure"));
        assert!(prompt.contains("# Load Relevant Guidance"));
        assert!(prompt.contains("Classify the request"));
        assert!(prompt.contains("Required integrations"));
        assert!(prompt.contains("Routine request"));
        assert!(prompt.contains(
            "Ask for explicit approval before work that will change persistent user data"
        ));
    }

    #[test]
    fn memory_guidance_requires_user_opt_in() {
        let prompt = system_prompt();

        assert!(prompt.contains("Want me to remember that for next time?"));
        assert!(prompt.contains("Save a learning only when"));
        assert!(!prompt.contains("Save ALL"));
        assert!(!prompt.contains("do NOT wait"));
    }

    #[test]
    fn action_guidance_omits_legacy_fields() {
        let prompt = system_prompt();

        assert!(!prompt.contains("tags:"));
        assert!(!prompt.contains("inputs"));
        assert!(!prompt.contains("prompt_template"));
    }

    #[test]
    fn onboarding_uses_current_action_layout() {
        let prompt = onboarding_prompt();

        assert!(prompt.contains(".agents/skills/core-workflow/SKILL.md"));
        assert!(prompt.contains("## Procedure"));
        assert!(!prompt.contains("core-workflow.md"));
        assert!(!prompt.contains("skill.sh"));
    }

    #[test]
    fn routine_guidance_maps_recurring_requests_to_routines() {
        let prompt = system_prompt();

        assert!(prompt.contains("## How-To Guidance: Routines"));
        assert!(prompt.contains("explicitly says \"routine\""));
        assert!(prompt.contains("treat it as a Routine setup or update"));
        assert!(
            prompt.contains("Ask for approval before creating, enabling, or changing a Routine")
        );
    }
}
