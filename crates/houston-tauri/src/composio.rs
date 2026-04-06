//! Composio integration: fetch active OAuth connections via the Composio MCP server.
//!
//! Reads the MCP server URL from `~/.claude.json` and the OAuth token from the
//! macOS keychain. Calls the `COMPOSIO_MANAGE_CONNECTIONS` tool to list which
//! services (Gmail, GitHub, Slack, etc.) the user has connected.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// -- Public types --

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComposioConnection {
    pub toolkit: String,
    pub display_name: String,
    pub description: String,
    pub email: Option<String>,
    pub logo_url: String,
    pub connected_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "status")]
pub enum ComposioResult {
    #[serde(rename = "not_configured")]
    NotConfigured,
    #[serde(rename = "needs_auth")]
    NeedsAuth,
    #[serde(rename = "error")]
    Error { message: String },
    #[serde(rename = "ok")]
    Ok {
        connections: Vec<ComposioConnection>,
    },
}

// -- Public API --

pub async fn list_active_connections() -> ComposioResult {
    let url = match read_composio_url() {
        Some(u) => u,
        None => return ComposioResult::NotConfigured,
    };

    // Get a valid token — refresh silently if expired
    let token = match get_valid_token().await {
        Some(t) => t,
        None => return ComposioResult::NeedsAuth,
    };

    let result = fetch_connections(&url, &token).await;

    // If fetch failed, try one refresh + retry before giving up
    if matches!(result, ComposioResult::Error { .. }) {
        eprintln!("[composio] Fetch failed, attempting token refresh and retry");
        if let Ok(new_token) = crate::composio_auth::refresh_access_token().await {
            return fetch_connections(&url, &new_token).await;
        }
    }

    result
}

async fn get_valid_token() -> Option<String> {
    let (token, expired) = read_oauth_token_with_expiry();
    let token = token?;

    if !expired {
        return Some(token);
    }

    // Token expired — try silent refresh
    eprintln!("[composio] Token expired, attempting silent refresh");
    match crate::composio_auth::refresh_access_token().await {
        Ok(new_token) => Some(new_token),
        Err(e) => {
            eprintln!("[composio] Silent refresh failed: {e}");
            None
        }
    }
}

// -- Config: read Composio URL from ~/.claude.json --

fn read_composio_url() -> Option<String> {
    let home = std::env::var("HOME").ok()?;
    let path = std::path::PathBuf::from(home).join(".claude.json");
    let content = std::fs::read_to_string(&path).ok()?;
    let config: serde_json::Value = serde_json::from_str(&content).ok()?;
    let composio = config.pointer("/mcpServers/composio")?;
    composio
        .pointer("/url")
        .and_then(|u| u.as_str())
        .map(String::from)
}

// -- Auth: read OAuth token from macOS keychain --

/// Returns (token, is_expired). Token is None if no credentials exist.
fn read_oauth_token_with_expiry() -> (Option<String>, bool) {
    let whoami = match std::process::Command::new("whoami").output() {
        Ok(o) => o,
        Err(_) => return (None, false),
    };
    let username = String::from_utf8_lossy(&whoami.stdout)
        .trim()
        .to_string();

    let output = match std::process::Command::new("security")
        .args([
            "find-generic-password",
            "-s",
            "Claude Code-credentials",
            "-a",
            &username,
            "-w",
        ])
        .output()
    {
        Ok(o) if o.status.success() => o,
        _ => return (None, false),
    };

    let json_str = String::from_utf8_lossy(&output.stdout);
    let data: serde_json::Value = match serde_json::from_str(json_str.trim()) {
        Ok(d) => d,
        Err(_) => return (None, false),
    };
    let mcp_oauth = match data.get("mcpOAuth").and_then(|v| v.as_object()) {
        Some(o) => o,
        None => return (None, false),
    };

    for (key, info) in mcp_oauth {
        if key.starts_with("composio") {
            let token = info
                .get("accessToken")
                .and_then(|t| t.as_str())
                .filter(|s| !s.is_empty())
                .map(String::from);

            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();
            let expires_at = info
                .get("expiresAt")
                .and_then(|e| e.as_u64())
                .unwrap_or(u64::MAX);
            let expired = now >= expires_at;

            return (token, expired);
        }
    }
    (None, false)
}

// -- Fetch connections via MCP JSON-RPC --

async fn fetch_connections(url: &str, token: &str) -> ComposioResult {
    let toolkits: Vec<String> = COMMON_TOOLKITS.iter().map(|s| s.to_string()).collect();
    let mut arguments = HashMap::new();
    arguments.insert("toolkits", serde_json::to_value(&toolkits).unwrap());

    let mcp_request = serde_json::json!({
        "jsonrpc": "2.0", "id": 1,
        "method": "tools/call",
        "params": { "name": "COMPOSIO_MANAGE_CONNECTIONS", "arguments": arguments }
    });

    let client = reqwest::Client::new();
    let response = match client
        .post(url)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json, text/event-stream")
        .header("Authorization", format!("Bearer {token}"))
        .json(&mcp_request)
        .send()
        .await
    {
        Ok(r) => r,
        Err(e) => {
            return ComposioResult::Error {
                message: format!("Could not reach Composio: {e}"),
            }
        }
    };

    let body = match response.text().await {
        Ok(b) => b,
        Err(e) => {
            return ComposioResult::Error {
                message: format!("Failed to read response: {e}"),
            }
        }
    };

    // Parse SSE "data: " line
    let data_line = match body.lines().find(|l| l.starts_with("data: ")) {
        Some(l) => &l[6..],
        None => {
            return ComposioResult::Error {
                message: "No data in Composio response".into(),
            }
        }
    };
    let rpc: serde_json::Value = match serde_json::from_str(data_line) {
        Ok(v) => v,
        Err(e) => {
            return ComposioResult::Error {
                message: format!("Invalid JSON: {e}"),
            }
        }
    };
    let text = match rpc
        .pointer("/result/content/0/text")
        .and_then(|t| t.as_str())
    {
        Some(t) => t,
        None => {
            return ComposioResult::Error {
                message: "Missing content in response".into(),
            }
        }
    };

    match parse_composio_json(text) {
        Ok(c) => ComposioResult::Ok { connections: c },
        Err(e) => ComposioResult::Error { message: e },
    }
}

// -- Parse the Composio response JSON --

fn parse_composio_json(text: &str) -> Result<Vec<ComposioConnection>, String> {
    let parsed: serde_json::Value =
        serde_json::from_str(text).map_err(|e| format!("Invalid JSON: {e}"))?;
    let results = parsed
        .pointer("/data/results")
        .and_then(|r| r.as_object())
        .ok_or("Missing data.results")?;

    let mut connections = Vec::new();
    for (toolkit, info) in results {
        if info.get("status").and_then(|s| s.as_str()) != Some("active") {
            continue;
        }
        let (display_name, icon_url, fallback_domain) = toolkit_meta(toolkit);
        let email = info
            .get("current_user_info")
            .and_then(|u| {
                u.get("email")
                    .or_else(|| u.get("emailAddress"))
                    .and_then(|e| e.as_str())
            })
            .map(String::from);
        let logo = if icon_url.is_empty() {
            format!("https://www.google.com/s2/favicons?domain={fallback_domain}&sz=128")
        } else {
            icon_url.to_string()
        };
        connections.push(ComposioConnection {
            display_name: display_name.to_string(),
            toolkit: toolkit.clone(),
            description: short_description(toolkit),
            email,
            logo_url: logo,
            connected_at: info
                .get("created_at")
                .and_then(|c| c.as_str())
                .map(String::from),
        });
    }
    connections.sort_by(|a, b| a.display_name.cmp(&b.display_name));
    Ok(connections)
}

// -- Toolkit metadata --

const COMMON_TOOLKITS: &[&str] = &[
    "gmail",
    "googledrive",
    "googlecalendar",
    "googlesheets",
    "slack",
    "github",
    "notion",
    "linear",
    "discord",
    "trello",
    "outlook",
    "airtable",
];

fn toolkit_meta(tk: &str) -> (&str, &str, &str) {
    match tk {
        "gmail" => (
            "Gmail",
            "https://www.gstatic.com/images/branding/product/2x/gmail_2020q4_48dp.png",
            "gmail.com",
        ),
        "googledrive" => (
            "Google Drive",
            "https://www.gstatic.com/images/branding/product/2x/drive_2020q4_48dp.png",
            "drive.google.com",
        ),
        "googlecalendar" => (
            "Google Calendar",
            "https://www.gstatic.com/images/branding/product/2x/calendar_2020q4_48dp.png",
            "calendar.google.com",
        ),
        "googlesheets" => (
            "Google Sheets",
            "https://www.gstatic.com/images/branding/product/2x/sheets_2020q4_48dp.png",
            "sheets.google.com",
        ),
        "slack" => (
            "Slack",
            "https://a.slack-edge.com/80588/marketing/img/meta/slack_hash_256.png",
            "slack.com",
        ),
        "github" => (
            "GitHub",
            "https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png",
            "github.com",
        ),
        "notion" => (
            "Notion",
            "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png",
            "notion.so",
        ),
        "linear" => (
            "Linear",
            "https://linear.app/static/apple-touch-icon.png",
            "linear.app",
        ),
        "discord" => (
            "Discord",
            "https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a69f118df70ad7828d4_icon_clyde_blurple_RGB.svg",
            "discord.com",
        ),
        "trello" => (
            "Trello",
            "https://trello.com/apple-touch-icon.png",
            "trello.com",
        ),
        "outlook" => (
            "Outlook",
            "https://outlook.live.com/favicon.ico",
            "outlook.com",
        ),
        "airtable" => (
            "Airtable",
            "https://airtable.com/images/favicon/baymax/apple-touch-icon.png",
            "airtable.com",
        ),
        _ => (tk, "", tk),
    }
}

fn short_description(toolkit: &str) -> String {
    match toolkit {
        "gmail" => "Send and read emails",
        "googledrive" => "Access files and folders",
        "googlecalendar" => "Manage events and schedules",
        "googlesheets" => "Read and edit spreadsheets",
        "slack" => "Send and read messages",
        "github" => "Manage repos and issues",
        "notion" => "Access pages and databases",
        "linear" => "Track issues and projects",
        "discord" => "Send and read messages",
        "trello" => "Manage boards and cards",
        "outlook" => "Send and read emails",
        "airtable" => "Access tables and records",
        _ => "Connected",
    }
    .to_string()
}
