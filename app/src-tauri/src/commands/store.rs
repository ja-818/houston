use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

const STORE_API: &str = "https://store.gethouston.ai/api";

#[derive(Serialize, Deserialize, Clone)]
pub struct StoreListing {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: String,
    pub author: String,
    pub tags: Vec<String>,
    pub icon_url: String,
    pub repo: String,
    pub installs: i64,
    pub registered_at: String,
}

#[derive(Deserialize)]
struct CatalogResponse {
    agents: Vec<StoreListing>,
}

fn agents_dir() -> PathBuf {
    let home = dirs::home_dir().expect("No home directory found");
    home.join(".houston").join("agents")
}

#[tauri::command(rename_all = "snake_case")]
pub async fn fetch_store_catalog() -> Result<Vec<StoreListing>, String> {
    let url = format!("{STORE_API}/catalog");
    let resp = reqwest::get(&url)
        .await
        .map_err(|e| format!("Failed to fetch store catalog: {e}"))?;

    if !resp.status().is_success() {
        return Err(format!("Store API returned {}", resp.status()));
    }

    let body = resp
        .json::<CatalogResponse>()
        .await
        .map_err(|e| format!("Failed to parse store catalog: {e}"))?;
    Ok(body.agents)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn search_store(query: String) -> Result<Vec<StoreListing>, String> {
    let url = format!("{STORE_API}/search?q={}", urlencoded(&query));
    let resp = reqwest::get(&url)
        .await
        .map_err(|e| format!("Failed to search store: {e}"))?;

    if !resp.status().is_success() {
        return Err(format!("Store API returned {}", resp.status()));
    }

    let body = resp
        .json::<CatalogResponse>()
        .await
        .map_err(|e| format!("Failed to parse search results: {e}"))?;
    Ok(body.agents)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn install_store_agent(
    repo: String,
    agent_id: String,
) -> Result<(), String> {
    let dir = agents_dir().join(&agent_id);
    fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create agent directory: {e}"))?;

    // Fetch houston.json from GitHub
    let config_url = format!(
        "https://raw.githubusercontent.com/{repo}/main/houston.json"
    );
    let config_resp = reqwest::get(&config_url)
        .await
        .map_err(|e| format!("Failed to fetch houston.json: {e}"))?;

    if !config_resp.status().is_success() {
        return Err(format!(
            "Failed to fetch houston.json ({})",
            config_resp.status()
        ));
    }

    let config_bytes = config_resp
        .bytes()
        .await
        .map_err(|e| format!("Failed to read houston.json: {e}"))?;
    fs::write(dir.join("houston.json"), &config_bytes)
        .map_err(|e| format!("Failed to save houston.json: {e}"))?;

    // Fetch icon.png (optional, don't fail if missing)
    let icon_url = format!(
        "https://raw.githubusercontent.com/{repo}/main/icon.png"
    );
    if let Ok(icon_resp) = reqwest::get(&icon_url).await {
        if icon_resp.status().is_success() {
            if let Ok(icon_bytes) = icon_resp.bytes().await {
                let _ = fs::write(dir.join("icon.png"), &icon_bytes);
            }
        }
    }

    // Fetch bundle.js (optional — only tier-2 agents have it)
    let bundle_url = format!(
        "https://raw.githubusercontent.com/{repo}/main/bundle.js"
    );
    if let Ok(bundle_resp) = reqwest::get(&bundle_url).await {
        if bundle_resp.status().is_success() {
            if let Ok(bundle_bytes) = bundle_resp.bytes().await {
                let _ = fs::write(dir.join("bundle.js"), &bundle_bytes);
            }
        }
    }

    // Fire-and-forget: notify registry of install
    let install_url = format!(
        "{STORE_API}/agents/{}/install",
        urlencoded(&agent_id)
    );
    let client = reqwest::Client::new();
    let _ = client.post(&install_url).send().await;

    Ok(())
}

#[tauri::command(rename_all = "snake_case")]
pub async fn uninstall_store_agent(agent_id: String) -> Result<(), String> {
    let dir = agents_dir().join(&agent_id);
    if dir.exists() {
        fs::remove_dir_all(&dir)
            .map_err(|e| format!("Failed to remove agent: {e}"))?;
    }
    Ok(())
}

/// Parse a GitHub URL or "owner/repo" shorthand into (owner, repo).
fn parse_github_ref(input: &str) -> Result<(String, String), String> {
    let trimmed = input.trim().trim_end_matches('/');
    // Handle full URL: https://github.com/owner/repo
    if let Some(rest) = trimmed.strip_prefix("https://github.com/") {
        let parts: Vec<&str> = rest.splitn(3, '/').collect();
        if parts.len() >= 2 && !parts[0].is_empty() && !parts[1].is_empty() {
            return Ok((parts[0].to_string(), parts[1].to_string()));
        }
        return Err(format!("Invalid GitHub URL: {input}"));
    }
    // Handle shorthand: owner/repo
    let parts: Vec<&str> = trimmed.splitn(3, '/').collect();
    if parts.len() == 2 && !parts[0].is_empty() && !parts[1].is_empty() {
        return Ok((parts[0].to_string(), parts[1].to_string()));
    }
    Err(format!("Expected 'owner/repo' or GitHub URL, got: {input}"))
}

/// Fetch a raw file from a GitHub repo. Returns None if 404.
async fn fetch_github_raw(
    owner: &str,
    repo: &str,
    filename: &str,
) -> Result<Option<Vec<u8>>, String> {
    let url = format!(
        "https://raw.githubusercontent.com/{owner}/{repo}/main/{filename}"
    );
    let client = reqwest::Client::new();
    let resp = client
        .get(&url)
        .header("Cache-Control", "no-cache")
        .header("Pragma", "no-cache")
        .send()
        .await
        .map_err(|e| format!("Failed to fetch {filename}: {e}"))?;
    if resp.status() == reqwest::StatusCode::NOT_FOUND {
        return Ok(None);
    }
    if !resp.status().is_success() {
        return Err(format!("Failed to fetch {filename} ({})", resp.status()));
    }
    let body = resp
        .bytes()
        .await
        .map_err(|e| format!("Failed to read {filename}: {e}"))?;
    Ok(Some(body.to_vec()))
}

#[tauri::command(rename_all = "snake_case")]
pub async fn install_agent_from_github(github_url: String) -> Result<String, String> {
    let (owner, repo) = parse_github_ref(&github_url)?;

    // houston.json is required
    let config_bytes: Vec<u8> = fetch_github_raw(&owner, &repo, "houston.json")
        .await?
        .ok_or_else(|| format!("No houston.json found in {owner}/{repo}"))?;

    // Parse the config to extract agent_id
    let config: serde_json::Value = serde_json::from_slice(&config_bytes)
        .map_err(|e| format!("Invalid houston.json: {e}"))?;
    let agent_id = config["id"]
        .as_str()
        .ok_or("houston.json missing 'id' field")?
        .to_string();

    let dir = agents_dir().join(&agent_id);
    fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create agent directory: {e}"))?;

    // Save houston.json
    fs::write(dir.join("houston.json"), &config_bytes)
        .map_err(|e| format!("Failed to save houston.json: {e}"))?;

    // Fetch optional files in parallel
    let (bundle, icon, claude_md) = tokio::join!(
        fetch_github_raw(&owner, &repo, "bundle.js"),
        fetch_github_raw(&owner, &repo, "icon.png"),
        fetch_github_raw(&owner, &repo, "CLAUDE.md"),
    );

    if let Ok(Some(bytes)) = bundle {
        let _ = fs::write(dir.join("bundle.js"), &bytes);
    }
    if let Ok(Some(bytes)) = icon {
        let _ = fs::write(dir.join("icon.png"), &bytes);
    }
    if let Ok(Some(bytes)) = claude_md {
        let _ = fs::write(dir.join("CLAUDE.md"), &bytes);
    }

    // Save source info so we can check for updates later
    let source = serde_json::json!({
        "repo": format!("{owner}/{repo}"),
        "installed_at": chrono::Utc::now().to_rfc3339(),
    });
    let _ = fs::write(
        dir.join(".source.json"),
        serde_json::to_string_pretty(&source).unwrap_or_default(),
    );

    tracing::info!(
        "[store] installed agent from github: {owner}/{repo} -> {agent_id}"
    );
    Ok(agent_id)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn check_agent_updates() -> Result<Vec<String>, String> {
    let dir = agents_dir();
    if !dir.exists() {
        return Ok(vec![]);
    }

    let mut updated = Vec::new();

    let entries = fs::read_dir(&dir).map_err(|e| e.to_string())?;
    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        let source_path = path.join(".source.json");
        if !source_path.exists() {
            continue;
        }

        // Read source info
        let source_str = fs::read_to_string(&source_path).map_err(|e| e.to_string())?;
        let source: serde_json::Value =
            serde_json::from_str(&source_str).map_err(|e| e.to_string())?;
        let repo = match source["repo"].as_str() {
            Some(r) => r.to_string(),
            None => continue,
        };

        let parts: Vec<&str> = repo.split('/').collect();
        if parts.len() != 2 {
            continue;
        }
        let (owner, repo_name) = (parts[0], parts[1]);

        // Compare houston.json
        let local_config = fs::read_to_string(path.join("houston.json")).unwrap_or_default();
        let remote_config = match fetch_github_raw(owner, repo_name, "houston.json").await {
            Ok(Some(bytes)) => String::from_utf8_lossy(&bytes).to_string(),
            _ => continue,
        };

        let config_changed = local_config.trim() != remote_config.trim();

        // Compare bundle.js by length (fast check)
        let local_bundle_len = fs::metadata(path.join("bundle.js")).map(|m| m.len()).unwrap_or(0);
        let remote_bundle = fetch_github_raw(owner, repo_name, "bundle.js").await;
        let bundle_changed = match &remote_bundle {
            Ok(Some(bytes)) => bytes.len() as u64 != local_bundle_len,
            _ => false,
        };

        if !config_changed && !bundle_changed {
            continue;
        }

        // Update files
        if config_changed {
            let _ = fs::write(path.join("houston.json"), &remote_config);
        }
        if let Ok(Some(bytes)) = remote_bundle {
            if bundle_changed {
                let _ = fs::write(path.join("bundle.js"), &bytes);
            }
        }

        // Also refresh CLAUDE.md
        if let Ok(Some(bytes)) = fetch_github_raw(owner, repo_name, "CLAUDE.md").await {
            let _ = fs::write(path.join("CLAUDE.md"), &bytes);
        }

        tracing::info!("[store] updated agent from {owner}/{repo_name}");
        updated.push(format!("{owner}/{repo_name}"));
    }

    Ok(updated)
}

/// Simple percent-encoding for query parameters.
fn urlencoded(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for b in s.bytes() {
        match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9'
            | b'-' | b'_' | b'.' | b'~' => out.push(b as char),
            b' ' => out.push('+'),
            _ => {
                out.push('%');
                out.push(char::from(HEX[(b >> 4) as usize]));
                out.push(char::from(HEX[(b & 0x0f) as usize]));
            }
        }
    }
    out
}

const HEX: [u8; 16] = *b"0123456789ABCDEF";
