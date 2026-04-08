//! Install skills from GitHub repositories.
//!
//! Provides three operations:
//! - `search_skills()` — query the skills.sh directory
//! - `install_skill()` — install a single skill from a GitHub repo
//! - `list_skills_from_repo()` — discover all SKILL.md files in a repo
//! - `install_from_repo()` — install selected skills from a repo

use crate::{CreateSkillInput, SkillError};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::path::Path;

// ── Public types ──────────────────────────────────────────────────

/// A skill returned by the skills.sh search API.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommunitySkill {
    pub id: String,
    #[serde(rename = "skillId")]
    pub skill_id: String,
    pub name: String,
    pub installs: u64,
    pub source: String,
}

/// A skill discovered in a GitHub repo (from a SKILL.md file).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RepoSkill {
    /// The install name — the parent directory of the SKILL.md file,
    /// or the repo name if SKILL.md is at the root.
    pub id: String,
    /// Human-readable title (from the `# Heading` in SKILL.md, or title-cased id).
    pub name: String,
    /// Short description from the SKILL.md frontmatter, if any.
    pub description: String,
    /// Full path within the repo (e.g. `research/SKILL.md`).
    pub path: String,
}

#[derive(Deserialize)]
struct SearchResponse {
    skills: Vec<CommunitySkill>,
}

// ── GitHub API types ──────────────────────────────────────────────

#[derive(Deserialize)]
struct GitTree {
    tree: Vec<GitTreeEntry>,
    truncated: bool,
}

#[derive(Deserialize)]
struct GitTreeEntry {
    path: String,
    #[serde(rename = "type")]
    entry_type: String,
}

// ── Public API ────────────────────────────────────────────────────

/// Search the skills.sh community directory.
pub async fn search_skills(query: &str) -> Result<Vec<CommunitySkill>, SkillError> {
    let client = build_client()?;
    let resp = client
        .get("https://skills.sh/api/search")
        .query(&[("q", query)])
        .send()
        .await
        .map_err(|e| SkillError::Io(format!("Search failed: {e}")))?;

    if !resp.status().is_success() {
        return Err(SkillError::Io(format!(
            "Skills search failed ({})",
            resp.status()
        )));
    }

    let result: SearchResponse = resp
        .json()
        .await
        .map_err(|e| SkillError::Io(format!("Failed to parse results: {e}")))?;

    Ok(result.skills)
}

/// Install a single community skill by fetching its SKILL.md from GitHub.
///
/// `source` is the GitHub `owner/repo`, `skill_id` is the skill directory name.
/// Returns the installed skill's local name.
pub async fn install_skill(
    skills_dir: &Path,
    source: &str,
    skill_id: &str,
) -> Result<String, SkillError> {
    std::fs::create_dir_all(skills_dir)
        .map_err(|e| SkillError::Io(e.to_string()))?;

    let client = build_client()?;
    let raw_md = fetch_skill_md_at_path(&client, source, &format!("skills/{skill_id}/SKILL.md")).await?;
    let parsed = parse_skill_md(&raw_md, skill_id);

    let install_name = skill_id.to_string();

    if skills_dir.join(&install_name).exists() {
        return Err(SkillError::AlreadyExists(install_name));
    }

    crate::create_skill(
        skills_dir,
        CreateSkillInput {
            name: install_name.clone(),
            description: parsed.description,
            content: parsed.content,
            tags: vec![],
        },
    )?;

    Ok(install_name)
}

/// Normalize a user-supplied repo reference into `owner/repo`.
///
/// Accepts full URLs (`https://github.com/owner/repo`) or short form (`owner/repo`).
fn normalize_source(source: &str) -> String {
    let s = source.trim().trim_end_matches('/');
    // Strip common URL prefixes
    for prefix in &["https://github.com/", "http://github.com/", "github.com/"] {
        if let Some(rest) = s.strip_prefix(prefix) {
            // Only keep the first two path segments (owner/repo)
            let parts: Vec<&str> = rest.splitn(3, '/').collect();
            return parts[..parts.len().min(2)].join("/");
        }
    }
    s.to_string()
}

/// Discover all SKILL.md files in a GitHub repo.
///
/// Uses the Git Trees API to recursively scan the repo without rate-limit
/// concerns. Returns one `RepoSkill` per SKILL.md found.
/// Accepts `owner/repo` or full GitHub URLs.
pub async fn list_skills_from_repo(source: &str) -> Result<Vec<RepoSkill>, SkillError> {
    let source = normalize_source(source);
    let source = source.as_str();
    let client = build_client()?;

    // First check that the repo exists and is accessible.
    let repo_url = format!("https://api.github.com/repos/{source}");
    let repo_resp = client
        .get(&repo_url)
        .send()
        .await
        .map_err(|e| SkillError::Io(format!("Network error: {e}")))?;

    match repo_resp.status().as_u16() {
        200 => {}
        401 | 403 => {
            return Err(SkillError::Io(
                "Repo is private — only public repos are supported".to_string(),
            ));
        }
        404 => {
            return Err(SkillError::Io(format!(
                "Repo '{source}' not found — check the owner/repo name"
            )));
        }
        429 => {
            return Err(SkillError::Io(
                "GitHub rate limit hit — wait a moment and try again".to_string(),
            ));
        }
        status => {
            return Err(SkillError::Io(format!(
                "GitHub returned {status} for repo '{source}'"
            )));
        }
    }

    // Fetch the full recursive file tree.
    let tree_url = format!("https://api.github.com/repos/{source}/git/trees/HEAD?recursive=1");
    let tree_resp = client
        .get(&tree_url)
        .send()
        .await
        .map_err(|e| SkillError::Io(format!("Network error: {e}")))?;

    if !tree_resp.status().is_success() {
        return Err(SkillError::Io(format!(
            "Could not read repo contents ({})",
            tree_resp.status()
        )));
    }

    let tree: GitTree = tree_resp
        .json()
        .await
        .map_err(|e| SkillError::Io(format!("Failed to parse repo tree: {e}")))?;

    if tree.truncated {
        tracing::warn!("[houston-skills] repo tree for {source} was truncated — some skills may be missing");
    }

    // Collect all blob paths named SKILL.md.
    let skill_paths: Vec<String> = tree
        .tree
        .into_iter()
        .filter(|e| e.entry_type == "blob" && e.path.ends_with("SKILL.md"))
        .map(|e| e.path)
        .collect();

    if skill_paths.is_empty() {
        return Err(SkillError::Io(format!(
            "No SKILL.md files found in '{source}' — add at least one SKILL.md to your repo"
        )));
    }

    // Build RepoSkill stubs — we don't fetch content here, just metadata.
    // The install step fetches actual content.
    let repo_name = source.split('/').last().unwrap_or(source);
    let mut skills = Vec::new();

    for path in skill_paths {
        let id = skill_id_from_path(&path, repo_name);
        // Peek at description by fetching content (small files, fast).
        let (name, description) = match fetch_skill_md_at_path(&client, source, &path).await {
            Ok(raw) => {
                let parsed = parse_skill_md(&raw, &id);
                (parsed.name, parsed.description)
            }
            Err(_) => (kebab_to_title(&id), String::new()),
        };
        skills.push(RepoSkill { id, name, description, path });
    }

    Ok(skills)
}

/// Install selected skills from a GitHub repo.
///
/// `skills` is a subset of what `list_skills_from_repo` returned — the user's
/// selection. Returns the names of successfully installed skills.
/// Accepts `owner/repo` or full GitHub URLs.
pub async fn install_from_repo(
    skills_dir: &Path,
    source: &str,
    skills: &[RepoSkill],
) -> Result<Vec<String>, SkillError> {
    let normalized = normalize_source(source);
    let source = normalized.as_str();
    std::fs::create_dir_all(skills_dir)
        .map_err(|e| SkillError::Io(e.to_string()))?;

    let client = build_client()?;
    let mut installed = Vec::new();

    for skill in skills {
        if skills_dir.join(&skill.id).exists() {
            installed.push(skill.id.clone());
            continue;
        }

        match fetch_skill_md_at_path(&client, source, &skill.path).await {
            Ok(raw_md) => {
                let parsed = parse_skill_md(&raw_md, &skill.id);
                let input = CreateSkillInput {
                    name: skill.id.clone(),
                    description: parsed.description,
                    content: parsed.content,
                    tags: vec![],
                };
                match crate::create_skill(skills_dir, input) {
                    Ok(()) => installed.push(skill.id.clone()),
                    Err(e) => tracing::warn!("[houston-skills] skip {}: {e}", skill.id),
                }
            }
            Err(e) => tracing::warn!("[houston-skills] skip {}: {e}", skill.id),
        }
    }

    Ok(installed)
}

// ── Internals ─────────────────────────────────────────────────────

fn build_client() -> Result<Client, SkillError> {
    Client::builder()
        .user_agent("houston-skills/1.0")
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| SkillError::Io(format!("HTTP client error: {e}")))
}

/// Derive an install ID from a SKILL.md path within the repo.
/// `research/SKILL.md` → `research`
/// `tools/code-review/SKILL.md` → `code-review`
/// `SKILL.md` (root) → `{repo_name}`
fn skill_id_from_path(path: &str, repo_name: &str) -> String {
    let without_filename = path.trim_end_matches("/SKILL.md");
    if without_filename == path {
        // Didn't end with /SKILL.md — it's a root SKILL.md
        return repo_name.to_string();
    }
    // Use the last path segment as the ID
    without_filename
        .split('/')
        .last()
        .unwrap_or(repo_name)
        .to_string()
}

async fn fetch_skill_md_at_path(
    client: &Client,
    source: &str,
    path: &str,
) -> Result<String, SkillError> {
    let branches = ["main", "master"];
    for branch in branches {
        let url = format!("https://raw.githubusercontent.com/{source}/{branch}/{path}");
        if let Ok(resp) = client.get(&url).send().await {
            if resp.status().is_success() {
                if let Ok(text) = resp.text().await {
                    return Ok(text);
                }
            }
        }
    }
    Err(SkillError::Io(format!(
        "Could not fetch '{path}' from {source}"
    )))
}

fn parse_skill_md(content: &str, fallback_id: &str) -> ParsedSkillMd {
    let mut description = String::new();
    let mut body_lines: Vec<&str> = Vec::new();
    let mut in_frontmatter = false;
    let mut frontmatter_done = false;

    for line in content.lines() {
        if line.trim() == "---" && !frontmatter_done {
            if in_frontmatter {
                frontmatter_done = true;
            } else {
                in_frontmatter = true;
            }
            continue;
        }

        if in_frontmatter && !frontmatter_done {
            if let Some(desc) = line.strip_prefix("description:") {
                description = desc.trim().trim_matches('"').to_string();
            }
        } else if frontmatter_done {
            body_lines.push(line);
        }
    }

    if !frontmatter_done {
        body_lines = content.lines().collect();
    }

    let mut name = String::new();
    for line in &body_lines {
        if let Some(title) = line.strip_prefix("# ") {
            name = title.trim().to_string();
            break;
        }
    }

    if name.is_empty() {
        name = kebab_to_title(fallback_id);
    }

    if description.len() > 200 {
        if let Some(pos) = description[..200].rfind(". ") {
            description = description[..=pos].to_string();
        } else {
            description.truncate(200);
        }
    }

    ParsedSkillMd {
        name,
        description,
        content: body_lines.join("\n").trim().to_string(),
    }
}

struct ParsedSkillMd {
    name: String,
    description: String,
    content: String,
}

fn kebab_to_title(s: &str) -> String {
    s.split('-')
        .filter(|w| !w.is_empty())
        .map(|w| {
            let mut c = w.chars();
            match c.next() {
                Some(first) => format!("{}{}", first.to_uppercase(), c.collect::<String>()),
                None => String::new(),
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalize_github_urls() {
        assert_eq!(normalize_source("owner/repo"), "owner/repo");
        assert_eq!(normalize_source("https://github.com/owner/repo"), "owner/repo");
        assert_eq!(normalize_source("https://github.com/owner/repo/"), "owner/repo");
        assert_eq!(normalize_source("http://github.com/owner/repo"), "owner/repo");
        assert_eq!(normalize_source("github.com/owner/repo"), "owner/repo");
        // Extra path segments are stripped
        assert_eq!(normalize_source("https://github.com/owner/repo/tree/main"), "owner/repo");
    }

    #[test]
    fn skill_id_from_root_skill_md() {
        assert_eq!(skill_id_from_path("SKILL.md", "my-repo"), "my-repo");
    }

    #[test]
    fn skill_id_from_nested_path() {
        assert_eq!(skill_id_from_path("research/SKILL.md", "repo"), "research");
        assert_eq!(skill_id_from_path("tools/code-review/SKILL.md", "repo"), "code-review");
    }

    #[test]
    fn parse_with_frontmatter() {
        let content = "\
---
name: my-skill
description: A test skill for testing
license: MIT
---

# My Awesome Skill

## When to Use
Use this when testing.";

        let parsed = parse_skill_md(content, "my-skill");
        assert_eq!(parsed.name, "My Awesome Skill");
        assert_eq!(parsed.description, "A test skill for testing");
        assert!(parsed.content.contains("## When to Use"));
    }

    #[test]
    fn parse_no_frontmatter() {
        let content = "# Plain Skill\n\nJust some instructions.";
        let parsed = parse_skill_md(content, "plain-skill");
        assert_eq!(parsed.name, "Plain Skill");
        assert!(parsed.description.is_empty());
        assert!(parsed.content.contains("Just some instructions"));
    }

    #[test]
    fn parse_no_title_falls_back_to_kebab() {
        let content = "\
---
description: No title heading here
---

Some content without a heading.";

        let parsed = parse_skill_md(content, "no-title-skill");
        assert_eq!(parsed.name, "No Title Skill");
        assert_eq!(parsed.description, "No title heading here");
    }

    #[test]
    fn kebab_to_title_basic() {
        assert_eq!(kebab_to_title("react-best-practices"), "React Best Practices");
        assert_eq!(kebab_to_title("single"), "Single");
    }
}
