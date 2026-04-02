use std::path::Path;

use anyhow::{Context, Result};

use crate::types::{Memory, MemoryCategory};

/// Write a memory as a markdown file at `{dir}/{project_id}/{category}/{id}.md`.
///
/// Creates intermediate directories as needed. Overwrites any existing file.
pub async fn write_memory_file(dir: &Path, memory: &Memory) -> Result<()> {
    let file_path = memory_file_path(dir, memory);

    if let Some(parent) = file_path.parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .context("Failed to create memory directory")?;
    }

    let tags_yaml = if memory.tags.is_empty() {
        "[]".to_string()
    } else {
        format!(
            "[{}]",
            memory
                .tags
                .iter()
                .map(|t| t.as_str())
                .collect::<Vec<_>>()
                .join(", ")
        )
    };

    let frontmatter = format!(
        "---\nid: {id}\ncategory: {category}\nsource: {source}\ntags: {tags}\ncreated: {created}\nupdated: {updated}\n---",
        id = memory.id,
        category = memory.category,
        source = memory.source,
        tags = tags_yaml,
        created = memory.created_at.to_rfc3339(),
        updated = memory.updated_at.to_rfc3339(),
    );

    let file_content = format!("{frontmatter}\n\n{content}\n", content = memory.content);

    tokio::fs::write(&file_path, file_content)
        .await
        .context("Failed to write memory markdown file")?;

    tracing::debug!(path = %file_path.display(), "wrote memory file");
    Ok(())
}

/// Delete the markdown file for a memory. No error if the file doesn't exist.
pub async fn delete_memory_file(dir: &Path, memory: &Memory) -> Result<()> {
    let file_path = memory_file_path(dir, memory);

    match tokio::fs::remove_file(&file_path).await {
        Ok(()) => {
            tracing::debug!(path = %file_path.display(), "deleted memory file");
        }
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
            // File already gone — not an error.
        }
        Err(e) => {
            return Err(anyhow::Error::new(e)
                .context("Failed to delete memory markdown file"));
        }
    }

    Ok(())
}

/// Parse a markdown memory file back into a `Memory` struct.
pub async fn read_memory_file(path: &Path) -> Result<Memory> {
    let raw = tokio::fs::read_to_string(path)
        .await
        .context("Failed to read memory file")?;

    parse_memory_markdown(&raw)
}

/// Build the file path: `{dir}/{project_id}/{category}/{id}.md`.
fn memory_file_path(dir: &Path, memory: &Memory) -> std::path::PathBuf {
    dir.join(&memory.project_id)
        .join(memory.category.to_string())
        .join(format!("{}.md", memory.id))
}

/// Parse a markdown string with YAML-like frontmatter into a Memory.
fn parse_memory_markdown(raw: &str) -> Result<Memory> {
    // Split on the frontmatter delimiters.
    let parts: Vec<&str> = raw.splitn(3, "---").collect();
    if parts.len() < 3 {
        return Err(anyhow::anyhow!(
            "invalid memory file: missing frontmatter delimiters"
        ));
    }

    let frontmatter = parts[1].trim();
    let content = parts[2].trim().to_string();

    let mut id = String::new();
    let mut category_str = String::new();
    let mut source = String::new();
    let mut tags: Vec<String> = Vec::new();
    let mut created_str = String::new();
    let mut updated_str = String::new();

    for line in frontmatter.lines() {
        let line = line.trim();
        // Use split_once on ": " (colon-space) to avoid splitting inside
        // RFC 3339 timestamps which contain colons in the time portion.
        if let Some((key, value)) = line.split_once(": ") {
            let key = key.trim();
            let value = value.trim();
            match key {
                "id" => id = value.to_string(),
                "category" => category_str = value.to_string(),
                "source" => source = value.to_string(),
                "tags" => tags = parse_tags(value),
                "created" => created_str = value.to_string(),
                "updated" => updated_str = value.to_string(),
                _ => {}
            }
        }
    }

    if id.is_empty() {
        return Err(anyhow::anyhow!("memory file missing id"));
    }

    let category: MemoryCategory = category_str
        .parse()
        .context("Failed to parse category from frontmatter")?;

    let created_at = chrono::DateTime::parse_from_rfc3339(&created_str)
        .context("Failed to parse created timestamp")?
        .with_timezone(&chrono::Utc);

    let updated_at = chrono::DateTime::parse_from_rfc3339(&updated_str)
        .context("Failed to parse updated timestamp")?
        .with_timezone(&chrono::Utc);

    // We can't recover project_id from the frontmatter alone;
    // it must be inferred from the directory path.
    // For standalone parsing, leave it empty — callers can set it.
    Ok(Memory {
        id,
        project_id: String::new(),
        content,
        category,
        source,
        tags,
        created_at,
        updated_at,
    })
}

/// Parse a simple `[tag1, tag2]` format into a Vec<String>.
fn parse_tags(value: &str) -> Vec<String> {
    let trimmed = value.trim().trim_start_matches('[').trim_end_matches(']');
    if trimmed.is_empty() {
        return Vec::new();
    }
    trimmed
        .split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::MemoryCategory;
    use chrono::Utc;

    fn sample_memory() -> Memory {
        Memory {
            id: "mem-001".into(),
            project_id: "proj-1".into(),
            content: "User prefers dark mode.".into(),
            category: MemoryCategory::Preference,
            source: "agent".into(),
            tags: vec!["ui".into(), "theme".into()],
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }

    #[tokio::test]
    async fn write_and_read_roundtrip() {
        let dir = tempfile::tempdir().expect("tempdir");
        let mem = sample_memory();

        write_memory_file(dir.path(), &mem).await.expect("write");

        let file_path = dir
            .path()
            .join("proj-1")
            .join("preference")
            .join("mem-001.md");
        assert!(file_path.exists());

        let parsed = read_memory_file(&file_path).await.expect("read");
        assert_eq!(parsed.id, mem.id);
        assert_eq!(parsed.content, mem.content);
        assert_eq!(parsed.category, MemoryCategory::Preference);
        assert_eq!(parsed.source, "agent");
        assert_eq!(parsed.tags, vec!["ui".to_string(), "theme".to_string()]);
    }

    #[tokio::test]
    async fn delete_nonexistent_is_ok() {
        let dir = tempfile::tempdir().expect("tempdir");
        let mem = sample_memory();

        // Should not error even if the file doesn't exist.
        delete_memory_file(dir.path(), &mem).await.expect("delete");
    }

    #[test]
    fn parse_tags_empty() {
        assert!(parse_tags("[]").is_empty());
    }

    #[test]
    fn parse_tags_values() {
        let tags = parse_tags("[rust, async, tokio]");
        assert_eq!(tags, vec!["rust", "async", "tokio"]);
    }
}
