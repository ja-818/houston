//! Skill input validation.

use crate::SkillError;

pub const MAX_NAME_LEN: usize = 64;
pub const MAX_DESCRIPTION_LEN: usize = 256;
pub const MAX_CONTENT_LEN: usize = 50_000;

/// Validate a skill name: lowercase alphanumeric + hyphens, max 64 chars.
pub fn name(name: &str) -> Result<(), SkillError> {
    if name.is_empty() {
        return Err(SkillError::Validation("Name cannot be empty".into()));
    }
    if name.len() > MAX_NAME_LEN {
        return Err(SkillError::Validation(format!(
            "Name exceeds {MAX_NAME_LEN} characters"
        )));
    }
    if !name
        .chars()
        .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
    {
        return Err(SkillError::Validation(
            "Name must be lowercase alphanumeric + hyphens only".into(),
        ));
    }
    Ok(())
}

/// Validate a skill description: max 256 chars.
pub fn description(desc: &str) -> Result<(), SkillError> {
    if desc.len() > MAX_DESCRIPTION_LEN {
        return Err(SkillError::Validation(format!(
            "Description exceeds {MAX_DESCRIPTION_LEN} characters"
        )));
    }
    Ok(())
}

/// Validate skill content: max 50,000 chars.
pub fn content(content: &str) -> Result<(), SkillError> {
    if content.len() > MAX_CONTENT_LEN {
        return Err(SkillError::Validation(format!(
            "Content exceeds {MAX_CONTENT_LEN} characters"
        )));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn valid_names() {
        assert!(name("valid-name-123").is_ok());
        assert!(name("a").is_ok());
        assert!(name("docker-deploy").is_ok());
    }

    #[test]
    fn invalid_names() {
        assert!(name("").is_err());
        assert!(name("Has Spaces").is_err());
        assert!(name("UPPERCASE").is_err());
        assert!(name("under_score").is_err());
        assert!(name(&"a".repeat(65)).is_err());
        assert!(name("special!chars").is_err());
    }

    #[test]
    fn description_limit() {
        assert!(description("short").is_ok());
        assert!(description(&"a".repeat(256)).is_ok());
        assert!(description(&"a".repeat(257)).is_err());
    }

    #[test]
    fn content_limit() {
        assert!(content("short").is_ok());
        assert!(content(&"a".repeat(50_000)).is_ok());
        assert!(content(&"a".repeat(50_001)).is_err());
    }
}
