//! SKILL.md frontmatter parsing and serialization.
//!
//! Frontmatter is delimited by `---` lines. Key-value pairs, one per line:
//! ```text
//! ---
//! name: docker-deploy
//! description: Deploy services via Docker Compose
//! version: 3
//! tags: [devops, docker]
//! created: 2026-03-28
//! last_used: 2026-04-04
//! ---
//! ```

use crate::{SkillError, SkillSummary};
use std::path::Path;

/// Parse a SKILL.md file into a SkillSummary + body content.
pub fn parse_file(path: &Path) -> Result<(SkillSummary, String), SkillError> {
    let raw = std::fs::read_to_string(path).map_err(|e| SkillError::Io(e.to_string()))?;
    parse_content(&raw)
}

/// Parse SKILL.md content string into SkillSummary + body.
pub fn parse_content(content: &str) -> Result<(SkillSummary, String), SkillError> {
    let (frontmatter, body) = split_frontmatter(content)?;
    let summary = parse_frontmatter(&frontmatter)?;
    Ok((summary, body))
}

/// Split content into frontmatter string and body string.
fn split_frontmatter(content: &str) -> Result<(String, String), SkillError> {
    let trimmed = content.trim_start();
    if !trimmed.starts_with("---") {
        return Err(SkillError::Parse("Missing opening --- delimiter".into()));
    }
    let after_first = &trimmed[3..];
    let after_first = after_first.strip_prefix('\n').unwrap_or(after_first);

    let Some(end_idx) = after_first.find("\n---") else {
        return Err(SkillError::Parse("Missing closing --- delimiter".into()));
    };
    let frontmatter = after_first[..end_idx].to_string();
    let body_start = end_idx + 4; // "\n---"
    let body = if body_start < after_first.len() {
        after_first[body_start..].trim_start_matches('\n').to_string()
    } else {
        String::new()
    };
    Ok((frontmatter, body))
}

/// Parse key-value pairs from frontmatter text.
fn parse_frontmatter(text: &str) -> Result<SkillSummary, SkillError> {
    let mut name = None;
    let mut description = None;
    let mut version: u32 = 1;
    let mut tags = Vec::new();
    let mut created = None;
    let mut last_used = None;

    for line in text.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        let Some((key, val)) = line.split_once(':') else {
            continue;
        };
        let key = key.trim();
        let val = val.trim();
        match key {
            "name" => name = Some(val.to_string()),
            "description" => description = Some(val.to_string()),
            "version" => version = val.parse().unwrap_or(1),
            "tags" => tags = parse_tags(val),
            "created" => created = Some(val.to_string()),
            "last_used" => last_used = Some(val.to_string()),
            _ => {} // ignore unknown keys
        }
    }

    let name = name.ok_or_else(|| SkillError::Parse("Missing 'name' in frontmatter".into()))?;
    let description = description.unwrap_or_default();

    Ok(SkillSummary {
        name,
        description,
        version,
        tags,
        created,
        last_used,
    })
}

/// Parse a `[tag1, tag2, tag3]` style array.
fn parse_tags(val: &str) -> Vec<String> {
    let trimmed = val.trim();
    let inner = trimmed
        .strip_prefix('[')
        .and_then(|s| s.strip_suffix(']'))
        .unwrap_or(trimmed);
    inner
        .split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect()
}

/// Serialize a SkillSummary + body into SKILL.md content.
pub fn serialize(summary: &SkillSummary, body: &str) -> String {
    let mut out = String::with_capacity(256 + body.len());
    out.push_str("---\n");
    out.push_str(&format!("name: {}\n", summary.name));
    out.push_str(&format!("description: {}\n", summary.description));
    out.push_str(&format!("version: {}\n", summary.version));
    if !summary.tags.is_empty() {
        let tags_str = summary.tags.join(", ");
        out.push_str(&format!("tags: [{tags_str}]\n"));
    } else {
        out.push_str("tags: []\n");
    }
    if let Some(created) = &summary.created {
        out.push_str(&format!("created: {created}\n"));
    }
    if let Some(last_used) = &summary.last_used {
        out.push_str(&format!("last_used: {last_used}\n"));
    }
    out.push_str("---\n");
    if !body.is_empty() {
        out.push('\n');
        out.push_str(body);
        if !body.ends_with('\n') {
            out.push('\n');
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_basic_frontmatter() {
        let content = "---\nname: test-skill\ndescription: A test\nversion: 2\ntags: [a, b]\ncreated: 2026-01-01\nlast_used: 2026-04-04\n---\n\n## Procedure\nDo stuff\n";
        let (summary, body) = parse_content(content).unwrap();
        assert_eq!(summary.name, "test-skill");
        assert_eq!(summary.description, "A test");
        assert_eq!(summary.version, 2);
        assert_eq!(summary.tags, vec!["a", "b"]);
        assert_eq!(summary.created.as_deref(), Some("2026-01-01"));
        assert_eq!(summary.last_used.as_deref(), Some("2026-04-04"));
        assert!(body.contains("## Procedure"));
    }

    #[test]
    fn parse_missing_optional_fields() {
        let content = "---\nname: minimal\n---\n\nBody here\n";
        let (summary, body) = parse_content(content).unwrap();
        assert_eq!(summary.name, "minimal");
        assert_eq!(summary.description, "");
        assert_eq!(summary.version, 1);
        assert!(summary.tags.is_empty());
        assert!(summary.created.is_none());
        assert_eq!(body.trim(), "Body here");
    }

    #[test]
    fn parse_malformed_no_opening() {
        let result = parse_content("no frontmatter here");
        assert!(result.is_err());
    }

    #[test]
    fn parse_malformed_no_closing() {
        let result = parse_content("---\nname: test\nno closing");
        assert!(result.is_err());
    }

    #[test]
    fn roundtrip_serialize() {
        let summary = SkillSummary {
            name: "test".into(),
            description: "A test skill".into(),
            version: 3,
            tags: vec!["devops".into(), "docker".into()],
            created: Some("2026-01-01".into()),
            last_used: Some("2026-04-04".into()),
        };
        let body = "## Procedure\n\n1. Do stuff\n";
        let serialized = serialize(&summary, body);
        let (parsed_summary, parsed_body) = parse_content(&serialized).unwrap();
        assert_eq!(parsed_summary.name, "test");
        assert_eq!(parsed_summary.version, 3);
        assert_eq!(parsed_summary.tags, vec!["devops", "docker"]);
        assert_eq!(parsed_body.trim(), body.trim());
    }

    #[test]
    fn empty_tags_roundtrip() {
        let summary = SkillSummary {
            name: "no-tags".into(),
            description: "No tags".into(),
            version: 1,
            tags: vec![],
            created: None,
            last_used: None,
        };
        let serialized = serialize(&summary, "body");
        assert!(serialized.contains("tags: []"));
        let (parsed, _) = parse_content(&serialized).unwrap();
        assert!(parsed.tags.is_empty());
    }
}
